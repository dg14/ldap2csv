import ldap from 'ldap-async'
import dotenv from 'dotenv';
import { format } from '@fast-csv/format';
import fs from 'fs';

dotenv.config();


(async () => {
  const client = new ldap({
    // either
    url: 'ldap://' + process.env.LDAP_HOST + ':' + process.env.LDAP_PORT,
    // optional pool size (default is 5 simultaneous connections)
    poolSize: process.env.LDAP_POOLSIZE,
    bindDN: process.env.LDAP_DN,
    bindCredentials: process.env.LDAP_PASS,
    timeout: 30000
  });
  let header = [];
  let csv_fields = process.env.CSV_FIELDS.split(",");
  for (let csv_field of csv_fields) {
    header.push(csv_field);
  }

  const iStream = client.stream(
    process.env.LDAP_BASE, {
    scope: 'sub',
    filter: process.env.LDAP_SEARCH
  }
  );

  let oStream = fs.createWriteStream(process.argv[2]);
  let csvStream = format({
    headers: header,
    delimiter: '\t'
  });
  csvStream.pipe(oStream);

  for await (const person of iStream) {
    let o1 = person.toJSON();
    let obj = [];
    for (let csv_field of csv_fields) {

      obj.push(o1[csv_field]);
    }
    csvStream.write(obj);
  }
  csvStream.end();
  oStream.end();
  console.log("DONE");
  await client.close();
})();