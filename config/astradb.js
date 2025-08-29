const { DataAPIClient } = require('@datastax/astra-db-ts');
require('dotenv').config();

class AstraDBConnection {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected) {
        return this.collection;
      }

      // Validate required environment variables
      this.validateConfig();

      console.log(`🔗 Connecting to AstraDB...`);
      console.log(`📍 Database ID: ${process.env.ASTRA_DB_ID}`);
      console.log(`🌍 Region: ${process.env.ASTRA_DB_REGION}`);
      console.log(`🔑 Keyspace: ${process.env.ASTRA_DB_KEYSPACE}`);

      // Initialize DataAPI client
      this.client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);

      // Connect to database using API endpoint
      const dbEndpoint = process.env.ASTRA_DB_API_ENDPOINT || 
        `https://${process.env.ASTRA_DB_ID}-${process.env.ASTRA_DB_REGION}.apps.astra.datastax.com`;

      console.log(`🔗 Using endpoint: ${dbEndpoint}`);

      this.db = this.client.db(dbEndpoint, {
        keyspace: process.env.ASTRA_DB_KEYSPACE
      });

      // Test connection by getting database info
      try {
        const dbInfo = await this.db.info();
        console.log(`✅ Database connected successfully`);
        console.log(`📊 Available keyspaces:`, dbInfo.info.keyspaces);
      } catch (infoError) {
        console.log(`⚠️  Could not get database info, proceeding with collection creation...`);
      }

      // Create or get vector collection
      console.log(`📦 Creating/accessing vector collection...`);
      
      try {
        // Try to create the collection
        this.collection = await this.db.createCollection('vector_embeddings', {
          vector: {
            dimension: parseInt(process.env.DEFAULT_VECTOR_DIMENSIONS) || 1536,
            metric: 'cosine'
          }
        });
        console.log('✅ Vector collection created successfully');
      } catch (collectionError) {
        if (collectionError.message.includes('already exists')) {
          // Collection exists, just get it
          console.log('📦 Vector collection already exists, accessing it...');
          this.collection = this.db.collection('vector_embeddings');
          console.log('✅ Vector collection accessed successfully');
        } else {
          throw collectionError;
        }
      }

      this.isConnected = true;
      console.log('✅ Connected to AstraDB successfully');
      return this.collection;

    } catch (error) {
      console.error('❌ AstraDB connection failed:', error.message);
      
      // Provide helpful error messages
      if (error.message.includes('keyspace')) {
        console.error(`
🔧 KEYSPACE ISSUE DETECTED:
The keyspace '${process.env.ASTRA_DB_KEYSPACE}' doesn't exist in your database.

SOLUTIONS:
1. Update .env to use 'default_keyspace' instead of '${process.env.ASTRA_DB_KEYSPACE}'
2. Or create the '${process.env.ASTRA_DB_KEYSPACE}' keyspace in your AstraDB console
3. Or check your database for available keyspaces

Visit: https://astra.datastax.com/org/<your-org>/database/${process.env.ASTRA_DB_ID}
        `);
      }
      
      if (error.message.includes('token') || error.message.includes('authentication')) {
        console.error(`
🔐 AUTHENTICATION ISSUE:
Please check your ASTRA_DB_APPLICATION_TOKEN in the .env file.
Make sure it has the correct permissions for your database.
        `);
      }

      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  validateConfig() {
    const required = [
      'ASTRA_DB_ID',
      'ASTRA_DB_REGION', 
      'ASTRA_DB_KEYSPACE',
      'ASTRA_DB_APPLICATION_TOKEN'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate API endpoint format if provided
    if (process.env.ASTRA_DB_API_ENDPOINT && !process.env.ASTRA_DB_API_ENDPOINT.startsWith('https://')) {
      throw new Error('ASTRA_DB_API_ENDPOINT must start with https://');
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        console.log('📤 Disconnected from AstraDB');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from AstraDB:', error.message);
    }
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      // Simple query to test connection
      await this.collection.findOne({}, { projection: { _id: 1 } });
      return { status: 'healthy', connected: true };
    } catch (error) {
      return { status: 'unhealthy', connected: false, error: error.message };
    }
  }

  getCollection() {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.collection;
  }
}

// Singleton instance
const astraDB = new AstraDBConnection();

module.exports = astraDB;
