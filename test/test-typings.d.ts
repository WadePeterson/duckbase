declare var sandbox: sinon.SinonSandbox;

declare namespace NodeJS {
  interface Global {
    sandbox: sinon.SinonSandbox;
  }
}
