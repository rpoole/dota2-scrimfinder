function activeScrims(params) {
    let includeRegions = ' AND r.region_name in (:regions) ';
    if (!params.regions) {
        includeRegions = ' ';
    }

    let includeLimit = ' LIMIT :limit ';
    if (!params.limit) {
        includeLimit = ' ';
    }

    let includeOffset = ' OFFSET :offset ';
    if (!params.offset) {
        includeOffset = ' ';
    }

    return `
        select s.*, GROUP_CONCAT(DISTINCT r.region_code order by r.region_code desc) codes
        FROM ( SELECT distinct s.*
               FROM scrims s
                      join scrims_regions sr on s.id = sr.scrim_id
                      join regions r on r.id = sr.region_id
               WHERE average_mmr >= :lower_mmr
                 AND average_mmr <= :upper_mmr
                 ${includeRegions}
               GROUP BY s.id ) s
               JOIN scrims_regions sr on s.id = sr.scrim_id
               JOIN regions r on r.id = sr.region_id
        GROUP BY s.id
        ORDER BY s.list_time
        ${includeLimit}
        ${includeOffset}
    `;
}

function activeScrimsCount(params) {
    let baseQuery = activeScrims(params);
    return `select count(*) count from (${baseQuery}) s`;
}

function createScrim() {
    return `
        INSERT INTO scrims (team_name, average_mmr, contact) VALUES (:team_name, :average_mmr, :contact)
    `;
}

function createScrimRegion() {
    return `
        INSERT INTO scrims_regions (scrim_id, region_id) values (:scrim_id, (select id from regions where region_name = :region_name))
    `;
}

module.exports = {
    activeScrims: activeScrims,
    activeScrimsCount: activeScrimsCount,
    createScrim: createScrim,
    createScrimRegion: createScrimRegion,
};
