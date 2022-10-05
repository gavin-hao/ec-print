import PrinterProvider from './printProvider';
import { PrinterConfig, PrintTask, Response } from './interfaces';

class Printer {
  private readonly agents: Array<{ key: string; value: PrinterProvider }> = [];
  constructor() {}
  registerOne<T extends PrinterProvider>(key: string, provider: T) {
    if (!this.agentKeys.includes(key)) {
      this.agents.push({ key, value: provider });
    } else {
      const idx = this.agents.findIndex((v) => v.key === key);
      this.agents.splice(idx, 1, { key, value: provider });
    }
    return this;
  }
  register(providers: Array<{ key: string; provider: PrinterProvider }>) {
    if (providers && providers.length) {
      providers.forEach((p) => {
        this.registerOne(p.key, p.provider);
      });
    }
    return this;
  }
  /**
   * return the first of registered printProviders
   */
  get defaultAgent() {
    return this.agents[0]?.value;
  }
  get agentKeys() {
    return this.agents.map((a) => a.key);
  }
  get allAgents() {
    return this.agents.map((v) => v.value);
  }
  get isConnect() {
    const status: { [k: string]: boolean } = {};
    this.agents.forEach((agent) => {
      status[agent.key] = agent.value.isConnect;
    });
    return status;
  }
  /**
   * get agent connect status ,if not agengKey return all registered agents status
   * @param agentKey
   * @returns
   */
  getAgentConnectStatus(agentKey?: string[]) {
    if (!agentKey || agentKey.length === 0) {
      return this.isConnect;
    }
    const { isConnect, agentKeys } = this;
    return agentKey.reduce((acc: { [k: string]: boolean }, cur: string) => {
      if (agentKeys.includes(cur)) {
        acc[cur] = isConnect[cur];
      }
      return acc;
    }, {});
  }
  /**
   * get the specific printProvider
   * @param key - provider key
   * @returns
   */
  getAgent(key: string) {
    return this.agents.find((a) => a.key === key)?.value;
  }
  private throwIfNoAgents() {
    if (this.agentKeys.length < 1) {
      throw new Error('no agent supplied');
    }
  }
  connect: () => Promise<{ [k: string]: boolean }> = async () => {
    this.throwIfNoAgents();
    const conns = this.agents.map((item) => item.value!.connect());
    await Promise.all(conns);
    return this.isConnect;
  };
  disconnect() {
    this.agents.forEach((agent) => {
      agent.value.disconnect();
    });
  }
  async reconnect(agengKey: string) {
    return await this.getAgent(agengKey)?.reconnect();
  }
  private getAgentOrDefault(agentKey?: string) {
    // const { getAgent, defaultAgent } = this;
    let agent;
    if (agentKey) {
      agent = this.getAgent(agentKey);
    } else {
      agent = this.defaultAgent;
    }
    return agent;
  }
  async print<T extends Response>(task: { _agentKey?: string } & PrintTask, agentKey?: string): Promise<T> {
    this.throwIfNoAgents();
    if (!agentKey) {
      agentKey = task._agentKey;
    }
    const agent = this.getAgentOrDefault(agentKey);

    delete task._agentKey;
    return (await agent!.print(task)) as T;
  }
  async printPreview<T extends Response>(task: { _agentKey?: string } & PrintTask, agentKey?: string): Promise<T> {
    this.throwIfNoAgents();
    if (!agentKey) {
      agentKey = task._agentKey;
    }
    const agent = this.getAgentOrDefault(agentKey);
    delete task.agentKey;
    return (await agent!.printPreview(task)) as T;
  }
  async getPrinters<T extends Response>(agentKey?: string): Promise<T> {
    this.throwIfNoAgents();
    let agent = this.getAgentOrDefault(agentKey);
    if (!agent?.isConnect) {
      agent = this.agents.find((v) => v.value.isConnect)?.value;
    }
    const res = await agent!.getPrinters();
    return res as T;
  }

  async getPrinterConfig<T extends Response>(printer: string): Promise<T> {
    this.throwIfNoAgents();
    let agent = this.getAgentOrDefault();
    if (!agent?.isConnect) {
      agent = this.agents.find((v) => v.value.isConnect)?.value;
    }
    const res = await agent!.getPrinterConfig(printer);
    return res as T;
  }
  async setPrinterConfig<T extends Response>(config: PrinterConfig, agentKey?: string): Promise<T> {
    this.throwIfNoAgents();
    let agent = this.getAgentOrDefault(agentKey);
    if (!agent?.isConnect) {
      agent = this.agents.find((v) => v.value.isConnect)?.value;
    }
    const res = await agent!.setPrinterConfig(config);
    return res as T;
  }
  notifyPrintResult(
    callback: <T extends { agentKey: string } & Response>(response: T) => void,
    agentKey: string[]
  ): void {
    agentKey?.forEach((k) => {
      const agent = this.getAgent(k);
      agent?.notifyPrintResult((response) => callback({ agentKey: k, ...response }));
    });
  }
  async getTaskStatus<T extends Response>(taskID: string[], agentKey: string): Promise<T> {
    this.throwIfNoAgents();
    const agent = this.getAgent(agentKey);
    const res = await agent!.getTaskStatus(taskID);
    return res as T;
  }
  async getGlobalConfig<T extends Response>(agentKey: string): Promise<T> {
    this.throwIfNoAgents();
    const agent = this.getAgentOrDefault(agentKey);
    const res = await agent!.getGlobalConfig();
    return res as T;
  }
  async setGlobalConfig<T extends Response>(
    config: { notifyOnTaskFailure?: boolean | undefined },
    agentKey: string
  ): Promise<T> {
    this.throwIfNoAgents();
    const agent = this.getAgentOrDefault(agentKey);
    const res = await agent!.setGlobalConfig(config);
    return res as T;
  }
  async getAgentInfo<T extends Response>(agentKey: string): Promise<T> {
    this.throwIfNoAgents();
    const agent = this.getAgentOrDefault(agentKey);
    const res = await agent!.getAgentInfo();
    return res as T;
  }
}
export default Printer;
