import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { EmployeeDirectory } from "./views/employee-directory.view.js";

function hasMariaConfig() {
  return Boolean(
    process.env.OFFICIAL_PERSONNEL_DB_HOST &&
    process.env.OFFICIAL_PERSONNEL_DB_USER &&
    process.env.OFFICIAL_PERSONNEL_DB_NAME,
  );
}

export const MariaDataSource = new DataSource({
  type: "mariadb",
  host: process.env.OFFICIAL_PERSONNEL_DB_HOST,
  port: Number(process.env.OFFICIAL_PERSONNEL_DB_PORT || 3307),
  username: process.env.OFFICIAL_PERSONNEL_DB_USER,
  password: process.env.OFFICIAL_PERSONNEL_DB_PASSWORD,
  database: process.env.OFFICIAL_PERSONNEL_DB_NAME,

  // Important
  synchronize: false, // DB legacy
  logging: false,

  entities: [EmployeeDirectory],
});

const employeeDirectoryViewSql = `
  CREATE OR REPLACE VIEW employee_directory AS
  SELECT
    LPAD(CAST(p.numat AS CHAR), 4, '0') AS matricule,
    p.prenag AS firstName,
    p.nomag AS lastName,
    d.libdirec AS direction,
    f.libfct AS fonction
  FROM personnel_anac p
  LEFT JOIN service_anac s
    ON s.codeserv = p.codeserv
  LEFT JOIN direction_anac d
    ON d.codedirec = s.codedirec
  LEFT JOIN fonction_anac f
    ON f.codefct = p.codefct
`;

export async function ensureMariaViews() {
  if (!hasMariaConfig()) {
    console.warn(
      "[mariadb] Skipping view provisioning because MariaDB is not configured",
    );
    return;
  }

  await MariaDataSource.query(employeeDirectoryViewSql);
}

export async function initializeMariaIfConfigured() {
  if (!hasMariaConfig()) {
    // console.log(`[mariadb] MariaDB is not configured, skipping initialization: ${process.env.OFFICIAL_PERSONNEL_DB_HOST} &&
    // ${process.env.OFFICIAL_PERSONNEL_DB_USER} &&
    // ${process.env.OFFICIAL_PERSONNEL_DB_NAME},`);
    console.warn(
      "[mariadb] MariaDB is not configured, skipping initialization",
    );
    return false;
  }

  if (!MariaDataSource.isInitialized) {
    await MariaDataSource.initialize();
  }

  await ensureMariaViews();
  console.log("MariaDB connected");
  return true;
}
