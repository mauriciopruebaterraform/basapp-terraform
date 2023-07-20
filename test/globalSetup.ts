import mysqlSetup from '@databases/mysql-test/jest/globalSetup';

const setup = async () => {
  await mysqlSetup();
};

export default setup;
