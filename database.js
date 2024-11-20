
const mysql = require('mysql2/promise');

class Database {
    constructor() {
        this.connection = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'CampingPlatform',
            port: 3306 
        });
    }

    async getQuery(query, params = []) {
        const [rows] = await this.connection.execute(query, params);
        return rows;
    }
}

module.exports = Database;
