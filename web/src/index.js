const Koa = require('koa');
const serverless = require('serverless-http');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();
const helpers = require('./helpers');
const queries = require('./queries');

let sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
//await sleep(1000)

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

const validRegions = [
    'US West',
    'US East',
    'Europe West',
    'Europe East',
    'Russia',
    'SE Asia',
    'Australia',
    'South America',
    'Dubai',
    'Chile',
    'Peru',
    'South Africa',
    'India',
    'Japan',
];

router.get('/active_scrims/', async (ctx) => {
    let params = ctx.request.query;

    let regions = params.regions.split(',');
    if (params.regions && !regions.every( r => validRegions.includes(r))) {
        ctx.status = 500;
        return;
    }

    if (!params.lower_mmr) {
        params.lower_mmr = 0;
    }
    if (!params.upper_mmr) {
        params.upper_mmr = 10000;
    }

    params.limit = parseInt(params.limit);
    params.start = parseInt(params.start);

    let scrims = await helpers.dbQuery(queries.activeScrims(params), params);
    let total = (await helpers.dbQuery(queries.activeScrimsCount(params), params))[0].count;

    ctx.body = {
        scrims: scrims,
        total: total,
    };
});

router.post('/list_scrim/', async (ctx) => {
    let id = (await helpers.dbQuery(queries.createScrim(), {
        average_mmr: ctx.request.body.average_mmr,
        contact: ctx.request.body.contact.trim(),
        team_name: ctx.request.body.team_name.trim(),
    })).insertId;

    for (let r of ctx.request.body.region) {
        await helpers.dbQuery(queries.createScrimRegion(), {
            scrim_id: id,
            region_name: r.name,
        });
    }

    ctx.status = 201
});

app.use(router.routes());
app.use(router.allowedMethods());

module.exports.handler = serverless(app);
