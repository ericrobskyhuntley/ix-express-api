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

const geoJsonIze = (query) => {
    const open = `SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', json_agg(ST_AsGeoJSON(result.*)::json)
    ) AS geojson
    FROM (`
    const close = ") AS result;"
    return open + query + close;
}

// exhibitors e
//             JOIN ix_by_country ic 
//                 ON e.name = ic.name
//             JOIN countries c 
//                 ON  ic.country = c.country
//             JOIN exhibitor_by_booth eb 
//                 ON e.name = eb.name
//             JOIN booths b 
//                 ON eb.booth_no = b.booth_no

const getIXBooths = (request, response) => {
    const q = `
        SELECT 
            b.booth_no AS booth_no,
            max(b.type) AS type,
            e.name AS exhibitor,
            e.website AS website,
            e.add AS add,
            st_union(b.geom) AS geom,
            array_agg(ic.country) AS countries
        FROM 
            booths AS b 
            LEFT JOIN exhibitor_by_booth AS eb
                ON b.booth_no = eb.booth_no
            LEFT JOIN exhibitors AS e
                ON eb.name = e.name
            LEFT JOIN ix_by_country ic 
                ON e.name = ic.name
        WHERE 
            (b.type = 'ix') 
            OR (b.type = 'pt') 
            OR (b.type = 'cs')
        GROUP BY
            b.booth_no, e.name, e.website, e.add`;
    const query = geoJsonIze(q);
    pool.query(query, [], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows[0].geojson);
    })
}

const getIXBoothsByInvestor = (request, response) => {
    const boothNum = parseFloat(request.params.boothNum)
    const q = `
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
            AND (b.booth_no = $1)`
    const query = geoJsonIze(q);
    pool.query(query, [boothNum], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows[0].geojson);
    })
}

const getExhibitorHQ = (request, response) => {
    // const boothNum = parseFloat(request.params.boothNum)
    const q = `
        SELECT
            eb.id AS id,
            e.name AS exhibitor, 
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
            OR (b.type = 'cs'))`;
    const query = geoJsonIze(q);
    pool.query(query, [], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows[0].geojson);
    })
}

const getHQCountry = (request, response) => {
    // const boothNum = parseFloat(request.params.boothNum)
    const q = `
        SELECT
            e.name AS investor,
            max(eb.booth_no) AS booth_no,
            count(c.country) AS country_cnt,
            st_union(st_makeline(e.geom, st_centroid(c.geom))) AS geom
        FROM 
            exhibitors e
            JOIN ix_by_country ic 
                ON e.name = ic.name
            JOIN countries c 
                ON  ic.country = c.country
            JOIN exhibitor_by_booth eb 
                ON e.name = eb.name
            JOIN booths b 
                ON eb.booth_no = b.booth_no
        WHERE
            (b.type = 'ix')
            OR (b.type = 'pt') 
            OR (b.type = 'cs')
        GROUP BY 
            e.name`;
    const query = geoJsonIze(q);
    pool.query(query, [], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows[0].geojson);
    })
}

const getCountries = (request, response) => {
    const q = `
        SELECT
            *
        FROM 
            countries AS c`;
    const query = geoJsonIze(q);
    pool.query(query, [], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows[0].geojson);
    })
}

const getExhibitors = (request, response) => {
    const q = `
        SELECT
            *
        FROM 
            exhibitors as e`;
    const query = geoJsonIze(q);
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
    getExhibitorHQ,
    getCountries,
    getExhibitors,
    getHQCountry
}
