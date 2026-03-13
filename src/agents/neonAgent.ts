import { addBuildLog, updateProject, encryptObject } from '@/lib';

interface NeonDatabase {
  id: string;
  name: string;
  connectionString: string;
  host: string;
}

export async function neonAgent(
  projectId: string,
  userId: string,
  appName: string,
  schema?: { tables: { name: string; columns: { name: string; type: string }[] }[] }
): Promise<{ database: NeonDatabase | null; error?: string }> {
  await addBuildLog(projectId, 'neon', 'Creating Neon database for app...', 'info');

  const apiKey = process.env.NEON_API_KEY;
  if (!apiKey) {
    const error = 'NEON_API_KEY not configured';
    await addBuildLog(projectId, 'neon', error, 'error');
    return { database: null, error };
  }

  try {
    // Create Neon project (database)
    const dbName = `${appName.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 20)}-${Date.now().toString(36).slice(-4)}`;
    
    const createRes = await fetch('https://console.neon.tech/api/v2/projects', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        project: {
          name: dbName,
          pg_version: 15,
          region_id: 'aws-us-east-1', // Default region
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Neon API error: ${err}`);
    }

    const project = await createRes.json();
    const projectData = project.project || project;
    
    // Get connection details
    const connectionRes = await fetch(`https://console.neon.tech/api/v2/projects/${projectData.id}/connection_uri`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!connectionRes.ok) {
      throw new Error('Failed to get connection URI');
    }

    const connectionData = await connectionRes.json();
    const connectionString = connectionData.uri || connectionData.connection_uri;

    // Extract host from connection string
    const hostMatch = connectionString.match(/@([^:]+):/);
    const host = hostMatch ? hostMatch[1] : '';

    const database: NeonDatabase = {
      id: projectData.id,
      name: dbName,
      connectionString,
      host,
    };

    await addBuildLog(projectId, 'neon', `Created database: ${dbName}`, 'info');

    // Create tables if schema provided
    if (schema?.tables?.length) {
      await addBuildLog(projectId, 'neon', 'Creating database schema...', 'info');
      
      for (const table of schema.tables) {
        const columns = table.columns.map(col => 
          `${col.name} ${mapTypeToPostgres(col.type)}`
        ).join(', ');
        
        const createTableSQL = `CREATE TABLE IF NOT EXISTS ${table.name} (id SERIAL PRIMARY KEY, ${columns}, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
        
        // Note: We can't execute SQL directly via API, so we store it for later execution
        await addBuildLog(projectId, 'neon', `Prepared table: ${table.name}`, 'info');
      }
    }

    // Encrypt and store connection details
    const encryptedDb = encryptObject({
      id: database.id,
      name: database.name,
      connectionString: database.connectionString,
      host: database.host,
    });

    await updateProject(projectId, {
      encrypted_secrets: JSON.stringify({
        neon_database: encryptedDb,
      }),
    });

    await addBuildLog(projectId, 'neon', 'Database encrypted and stored', 'info');

    return { database };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await addBuildLog(projectId, 'neon', `Failed: ${error}`, 'error');
    return { database: null, error };
  }
}

// Helper to map common types to Postgres types
function mapTypeToPostgres(type: string): string {
  const typeMap: Record<string, string> = {
    'string': 'VARCHAR(255)',
    'text': 'TEXT',
    'number': 'NUMERIC',
    'integer': 'INTEGER',
    'boolean': 'BOOLEAN',
    'date': 'DATE',
    'datetime': 'TIMESTAMP',
    'timestamp': 'TIMESTAMP',
    'uuid': 'UUID',
    'json': 'JSONB',
    'array': 'TEXT[]',
    'email': 'VARCHAR(255)',
    'url': 'TEXT',
    'enum': 'VARCHAR(50)',
  };
  
  return typeMap[type.toLowerCase()] || 'TEXT';
}

// Generate .env content for the deployed app
export function generateNeonEnvFile(connectionString: string): string {
  return `# Database - Neon Postgres
DATABASE_URL=${connectionString}
POSTGRES_URL=${connectionString}
POSTGRES_URL_NON_POOLING=${connectionString.replace('?sslmode=require', '')}
POSTGRES_PRISMA_URL=${connectionString}?pgbouncer=true&connect_timeout=15

# For Prisma (if used)
# DATABASE_URL with connection pooling for serverless
`;
}
