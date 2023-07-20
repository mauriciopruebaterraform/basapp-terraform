import mysqlTeardown from '@databases/mysql-test/jest/globalTeardown';

const teardown = async () => {
  await mysqlTeardown();
};

export default teardown;
