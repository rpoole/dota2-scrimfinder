const mysql = require('mysql');
const util = require('util');
const Koa = require('koa');
const serverless = require('serverless-http');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

async function dbQuery(queryStr) {
    let connection = mysql.createConnection({
        host     : 'db',
        user     : 'root',
        password : 'rootpass',
        database : 'dota2_scrimfinder'
    });

    let query = util.promisify(connection.query).bind(connection);
    connection.connect();

    let result;
    try {
        result = await query(queryStr);
    } finally {
        connection.end();
    }

    return result;
}

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = err.message;
        ctx.app.emit('error', err, ctx);
    }
});

app.use(bodyParser());

router.get('/active_scrims', async (ctx) => {
    ctx.body = await dbQuery('select * from scrims');
});

app.use(router.routes());
app.use(router.allowedMethods());

module.exports.handler = serverless(app);
