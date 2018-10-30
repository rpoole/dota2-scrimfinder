const util = require('util');
const mysql = require('mysql');

module.exports = {
    dbQuery: dbQuery,
};

async function dbQuery(queryStr, values) {
    let connection = mysql.createConnection({
        host     : 'db',
        user     : 'root',
        password : 'rootpass',
        database : 'dota2_scrimfinder'
    });

    // taken from node mysql page
    connection.config.queryFormat = function (query, values) {
        if (!values) return query;
        return query.replace(/\:(\w+)/g, function (txt, key) {
            if (key in values) {
                return this.escape(values[key]);
            }
            return txt;
        }.bind(this));
    };


    let query = util.promisify(connection.query).bind(connection);
    connection.connect();

    let result;
    try {
        result = await query(queryStr, values);
    } finally {
        connection.end();
    }

    return result;
}
