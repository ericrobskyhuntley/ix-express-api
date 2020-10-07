const creds = require('./creds'),
    fs = require("fs"),
    path = require('path'),
    pg = require('pg');

pg.defaults.ssl = true;
const Pool = pg.Pool;

const pool = new Pool({
    user: creds.dbUser,
    host: creds.dbHost,
    database: creds.dbName,
    password: creds.dbPass,
    port: creds.dbPort,
    ssl: {
        rejectUnauthorized: false
        // ca: fs.readFileSync(path.join(__dirname, 'cert/ca-certificate.crt')).toString()
    }
})

const getIXBooths = (request, response) => {
    const query = `SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', json_agg(ST_AsGeoJSON(result.*)::json)
    ) AS geojson
    FROM (
        SELECT 
            * 
        FROM 
            booths AS b 
        WHERE 
            (b.type = 'ix') 
            OR (b.type = 'pt') 
            OR (b.type = 'cs')
        ORDER BY 
            b.booth_no ASC
    ) AS result;`
    pool.query(query, [], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows[0].geojson);
    })
}

const getIXBoothsByInvestor = (request, response) => {
    const boothNum = parseFloat(request.params.boothNum)
    const query = `
    SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', json_agg(ST_AsGeoJSON(result.*)::json)
    ) AS geojson
    FROM (
        SELECT
            eb.id AS id,
            e.name AS investor, 
            eb.booth_no AS booth_no,
            e.exchange AS exchange,
            e.stock AS stock,
            e.add AS address,
            e.city AS city,
            e.region AS region,
            e.state AS state,
            e.country AS country,
            e.website AS web,
            ST_MAKELINE(e.geom, ST_CENTROID(b.geom)) AS geom
        FROM 
            exhibitors AS e
            INNER JOIN exhibitor_by_booth AS eb
            ON e.name=eb.name
                INNER JOIN booths AS b
                ON eb.booth_no=b.booth_no
        WHERE 
            ((b.type = 'ix') 
            OR (b.type = 'pt') 
            OR (b.type = 'cs'))
            AND (b.booth_no = $1)
    ) AS result;
    `
    pool.query(query, [boothNum], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows[0].geojson);
    })
}

const getCountries = (request, response) => {
    const query = `
    SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', json_agg(ST_AsGeoJSON(result.*)::json)
    ) AS geojson
    FROM (
        SELECT
            *
        FROM 
            countries AS c
    ) AS result;
    `
    pool.query(query, [], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows[0].geojson);
    })
}

module.exports = {
    getIXBooths,
    getIXBoothsByInvestor,
    getCountries
}
