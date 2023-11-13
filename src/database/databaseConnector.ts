// src/database/databaseConnector.ts

export abstract class DatabaseConnector {
    protected connectionOptions: any;
    protected connected: boolean = false;
  
    constructor(connectionOptions: any) {
      this.connectionOptions = connectionOptions;
    }
  
    abstract connect(): Promise<void>;
  
    abstract getModel(modelName: string): any;
  
    // Add other common methods or properties that are shared across connectors
  }
  