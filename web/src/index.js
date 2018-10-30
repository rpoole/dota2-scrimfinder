const Koa = require('koa');
const serverless = require('serverless-http');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();
const helpers = require('./helpers');


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
    let params = ctx.request.query;
    if (!params.lower_mmr) {
        params.lower_mmr = 0;
    }
    if (!params.upper_mmr) {
        params.upper_mmr = 10000;
    }

    params.limit = parseInt(params.limit);
    params.start = parseInt(params.start);
    params.lower_mmr = parseInt(params.lower_mmr);
    params.upper_mmr = parseInt(params.upper_mmr);

    let query = `
        SELECT * FROM scrims 
        WHERE average_mmr >= :lower_mmr AND
        average_mmr <= :upper_mmr
    `;

    let countQuery = `
        SELECT count(*) as count FROM scrims 
        WHERE average_mmr >= :lower_mmr AND
        average_mmr <= :upper_mmr
    `;

    if (params.region) {
        query += 'AND region = :region';
        countQuery += 'AND region = :region';
    }

    query += 'ORDER BY list_time DESC LIMIT :limit OFFSET :start';

    let sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    await sleep(1000)

    let scrims = await helpers.dbQuery(query, params);
    let total = (await helpers.dbQuery(countQuery, params))[0].count;

    ctx.body = {
        scrims: scrims,
        total: total,
    };
});

app.use(router.routes());
app.use(router.allowedMethods());

module.exports.handler = serverless(app);
