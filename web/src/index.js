const Koa = require('koa');
const serverless = require('serverless-http');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const crypto = require('crypto');

const helpers = require('./helpers');
const queries = require('./queries');
const validations = require('./validations');

const app = new Koa();
const router = new Router();

let sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = err.message;
        ctx.app.emit('error', err, ctx);
    }
});

app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Credentials', true);

	await next();
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

app.use(async (ctx, next) => {
    let params;
    if (ctx.request.method === 'GET') {
        params = ctx.request.query;
    } else if (ctx.request.method === 'POST'){
        params = ctx.request.body;
    } else {
        await next();
        return;
    }

    let path = `validate_${ctx.request.url.split('?')[0].substring(1)}`;
    let validateFn = validations[path];

    validateFn(params);
    if (validateFn.errors) {
        ctx.status = 500;
        ctx.body = validateFn.errors;
        return;
    } else {
        ctx.params = params;
        await next();
    }
});

router.get('/active_scrims/', async (ctx) => {
    const params = ctx.params;

    if (params.regions) {
        let regions = params.regions.split(',');
        if (params.regions && !regions.every( r => validRegions.includes(r))) {
            ctx.status = 500;
            return;
        }
        params.regions = regions;
    }

    const scrims = await helpers.dbQuery(queries.activeScrims(params), params);
    const {limit, ...countParams} = params;
    const total = (await helpers.dbQuery(queries.activeScrimsCount(countParams), params))[0].count;

    ctx.body = {
        scrims: scrims,
        total: total,
    };
});


router.post('/list_scrim/', async (ctx) => {
    let params = ctx.params;

    let id = (await helpers.dbQuery(queries.createScrim(), {
        average_mmr: params.average_mmr,
        contact: params.contact.trim(),
        team_name: params.team_name.trim(),
    })).insertId;

    for (let r of params.region) {
        await helpers.dbQuery(queries.createScrimRegion(), {
            scrim_id: id,
            region_name: r.name,
        });
    }

    const token = crypto.randomBytes(64).toString('hex');

    await helpers.dbQuery(queries.createScrimKey(), {
        scrim_id: id,
        token: token,
    });

    ctx.body = {
        token: token,
        scrim_id: id,
    };

    ctx.status = 201
});

router.post('/renew_scrim_key', async(ctx) => {
    let params = ctx.params;

    await helpers.dbQuery(queries.renewScrimKey(), {
        token: params.token,
    });

    ctx.status = 200;
});

router.delete('/remove_scrim/:token', async (ctx) => {
    let params = ctx.params;

    let scrimKey = (await helpers.dbQuery(queries.getScrimKey(), {
        token: params.token,
    }))[0];

    if (!scrimKey) {
        ctx.status = 400;
        return;
    }

    await helpers.dbQuery(queries.deleteScrim(), {
        id: scrimKey.scrim_id,
    });

    ctx.status = 204;
});

app.use(router.routes());
app.use(router.allowedMethods());

module.exports.handler = serverless(app);

module.exports.reap_scrims = async () => {
	await helpers.dbQuery(queries.deleteExpiredScrims());
};
