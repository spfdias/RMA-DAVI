declare module 'sql.js' {
  export interface DatabaseConstructor {
    new (data?: ArrayLike<number> | Buffer | null): Database;
  }

  export interface SqlJsStatic {
    Database: DatabaseConstructor;
  }

  export interface Database {
    run(sql: string, params?: any[]): Database;
    exec(sql: string): { columns: string[]; values: any[][] }[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  export interface Statement {
    bind(params?: any[]): boolean;
    step(): boolean;
    getAsObject(params?: object): any;
    free(): boolean;
  }

  const initSqlJs: (config?: any) => Promise<SqlJsStatic>;
  export default initSqlJs;
  export = initSqlJs;
}
