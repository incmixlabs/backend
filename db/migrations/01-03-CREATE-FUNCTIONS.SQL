-- https://stackoverflow.com/questions/25202133/how-to-show-the-triggers-associated-with-a-view-or-a-table-in-postgresql
-- SELECT indexdef FROM pg_constraints WHERE LOWER(tablename) = lower('users') and lower(schemaname) = lower('incmix');
CREATE OR REPLACE FUNCTION incmix.get_info(table_name text, schema_name text DEFAULT 'incmix')
RETURNS jsonb AS $$
    var stmt = `SELECT
    tc.table_schema,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema='${schema_name}'
        AND tc.table_name='${table_name}'`;
    var recs= plv8.execute('select incmix.get_records($1, $2)', stmt, ['']);
    for (var i = 0; i < recs.length; i++) {
        var rec = recs[i]['get_records'];
        plv8.elog(INFO, `rec: ${rec}`);
        recs[i] = rec;
    }
    return recs;
$$ LANGUAGE plv8 IMMUTABLE STRICT;
CREATE OR REPLACE FUNCTION is_valid_url(url text) RETURNS BOOLEAN AS $$
    if (!!!url) {
        return false;
    }
    url = url.trim();
    if (url.length === 0) {
        return false;
    }
    if (url.length > 255) {
        return false;
    }
    var regex = new RegExp(`^((http|https)://)?[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$`)
    return regex.test(url);
$$ LANGUAGE plv8 IMMUTABLE STRICT;
select is_valid_url('http://www.google.com');

CREATE OR REPLACE FUNCTION incmix.get_records_internal(stmt text)
RETURNS SETOF jsonb -- Or setof json
AS $$
  try {
    var users = plv8.execute(stmt);
    var len = users.length;
    for (var i = 0; i < len; i++) {
        // You can modify the objects here if needed
        plv8.return_next(users[i]); // Return each object as a row
    }
  } catch (err) {
    plv8.elog(ERROR, err);
  }
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION incmix.get_records(stmt text, columns text[])
RETURNS SETOF jsonb
AS $$
try {

    var recs = plv8.execute('select incmix.get_records_internal($1)', stmt);
    plv8.elog(INFO, `recs: ${recs.length}`);
    var len = recs.length;
    var results = new Array(len);
    plv8.elog(INFO, `recs: ${recs.length}`);
    var notColumns = columns.length === 0 || !!!columns[0];
    var singleton = columns.length === 1 && !!columns[0];
    var col = singleton && columns[0] ? columns[0] : null;
    plv8.elog(INFO, `notColumns: ${notColumns}`);
    plv8.elog(INFO, `singleton: ${singleton}`);
    for (var i = 0; i < len; i++) {
        results[i] = {};
        plv8.elog(INFO, `i: ${i}`);
        var rec= recs[i]['get_records_internal'];

        plv8.elog(INFO, `notColumns: ${notColumns}`);

        if (singleton) {
            results[i] = col ? rec[col] : rec[Object.keys(rec)[0]];
            continue;
        }
        plv8.elog(INFO,`columns 138: ${columns.length}`);
        if (notColumns) {
            results[i] = rec;
            continue;
        }
        for (var j = 0; j < columns.length; j++) {
            plv8.elog(INFO, `column: ${rec[columns[j]]} ${columns[j]}`);
            results[i][columns[j]] = rec[columns[j]];
        }
    }
}catch (err) {
    plv8.elog(ERROR, err);
    return `ERROR: ${err}`;
} finally {
    plv8.elog(INFO, `returning #150: ${results.length}`);
}
plv8.elog(INFO, `returning #153: ${results}`);
return results;
$$ LANGUAGE plv8;
select incmix.get_info('auth','incmix');

CREATE OR REPLACE FUNCTION incmix.check_table_exists( table_name text, schema_name text DEFAULT 'incmix')
RETURNS boolean
AS $$
    var  stmt = `SELECT 1 FROM pg_tables WHERE schemaname = ${schema_name} AND tablename = ${table_name}`;
    try {
        var result = plv8.execute(stmt);
        if (result && result.length > 0) {
            return true;
        }
    } catch (err) {
        plv8.elog(ERROR, err);
        return false;
    }
    return false;
$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION getColumnNo(table_schema,table_name text, column_name text) RETURNS INTEGER AS $$
    var stmt = `SELECT ordinal_position FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`;
    var result = plv8.execute(stmt, table_name, column_name);
    if (result.length > 0) {
        return result[0]['ordinal_position'];
    }
    return -1;
$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION incmix.getRandomString(length integer) RETURNS TEXT AS $$
    var result = '';
    var stmt = `select string_agg(substr(characters, (random() * (length(characters) - 1) + 1)::INTEGER, 1), '')
            from symbols
            join generate_series(1,${length}) as word(chr_idx) on 1 = 1 -- word length
            join generate_series(1,1) as words(idx) on 1 = 1`
    var result = plv8.execute(stmt)[0]['string_agg'];
    return result;
$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION incmix.setMMN(table_name text, schema_name text DEFAULT 'incmix')
RETURNS TEXT AS $$
    var findUnique = false;
    table_name = table_name.toUpperCase();
    plv8.elog(INFO, `table name: ${table_name}`);
    var tbls = plv8.execute(`SELECT string_to_array($1,'_')`, table_name)[0]['string_to_array'];
    var tblName = table_name
    var n = 3
    if (tbls.length > 1) {
        plv8.elog(INFO, `tbls: ${tbls[0]} ${tbls[1]}`);
        tblName = tbls[0].substring(0,1) + tbls[1].substring(0,1);
        if (tbls.length > 2) {
            tblName = tblName + tbls[2].substring(1,1);
        }
        else {
            tblName += tbls[0].substring(1,2);
        }
    }
    tblName = tblName.toUpperCase();
    plv8.elog(INFO, `table name: ${tblName}`);
    var upper = true;
    var random = false;
    var mmn = tblName;
    while (!findUnique) {
        for (var i = 1; i <= n; i++) {
            mmn = tblName.substring(0, i);
            if (random) {
                mmn = mmn + incmix.getRandomString(3-n);
            }
            var stmt = `SELECT mmn FROM ${schema_name}.mmn WHERE table_name = '${mmn}'`;
            plv8.elog(INFO, `stmt: ${stmt}`);
            var result = plv8.execute(stmt);
            if (result && result.length > 0) {
                continue;
            } else {
                findUnique = true;
                var stmt = `INSERT INTO ${schema_name}.mmn (table_name, mmn) VALUES ('${table_name}', '${mmn}')`;
                plv8.elog(INFO, `found unique mmn: ${mmn}`);
                return mmn;
            }
        }
        if (upper) {
            tblName = tblName.toLowerCase();
            upper = false;
        } else {
            tblName = tblName.toUpperCase();
            upper = true;
            random = true;
            n = 1;
        }
    }
    return mmn;
$$ LANGUAGE plv8 IMMUTABLE STRICT;
