<template>
  <div class="common-layout">
    <el-container>
      <el-header>
        <h3>打印</h3>
      </el-header>
      <el-main>
        <el-scrollbar>
          <div class="list">
            <div class="toolbar">
              <div class="status">打印机：{{ printers.join(',') }}</div>
              <div>
                <el-popover placement="top-start" title="打印组件状态" :width="280" trigger="click">
                  <template #reference>
                    <el-badge is-dot class="item" :hidden="connects.some((v) => v.connect)">
                      <el-icon><Link /></el-icon
                    ></el-badge>
                  </template>
                  <div>
                    <div class="connect-info" v-for="status in connects">
                      <label>{{ status.name }}</label
                      ><span :class="status.connect ? 'opend' : 'closed'"
                        >{{ status.connect ? '已连接' : '未连接' }}
                      </span>
                      <span
                        ><el-button
                          @click="reconnect(status.name)"
                          :disabled="status.connect"
                          :loading="connectings[status.name]"
                          size="small"
                          text
                          :icon="Refresh"
                        ></el-button
                      ></span>
                    </div>
                  </div>
                </el-popover>
              </div>
              <div>
                <el-button
                  type="primary"
                  :disabled="multipleSelection.length === 0"
                  @click="handlePrint"
                  :icon="PrinterIcon"
                  >打印</el-button
                >
              </div>
            </div>
            <el-table ref="multipleTableRef" :data="tableData" @selection-change="handleSelectionChange">
              <el-table-column type="selection" width="55" />
              <el-table-column prop="date" label="Date" width="140" />
              <el-table-column prop="name" label="Product" width="120" />
              <el-table-column prop="address" label="Address" />
              <el-table-column prop="platform" label="Platform" />
            </el-table>
          </div>
        </el-scrollbar>
      </el-main>
      <el-dialog v-model="showProgress" title="正在打印" :close-on-click-modal="false">
        <div>{{ printIdicator.current }}/{{ printIdicator.total }}</div>
        <el-progress :percentage="percentage" />
        <div class="logs">
          <p v-for="text in printLogs">{{ text }}</p>
        </div>
      </el-dialog>
    </el-container>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { Printer as PrinterIcon, Link, Refresh } from '@element-plus/icons-vue';
import { usePrinter, usePrinterConnectStatus } from './plugin';
import { getUUID, PrintTask } from 'ec-print';
// import {ref}
interface Order {
  date: string;
  name: string;
  address: string;
  platform: string;
}
const multipleTableRef = ref();
const tableData: Order[] = [
  {
    date: '2016-05-03',
    name: 'Iphone14 pro max  512G',
    address: 'No. 189, Grove St, Los Angeles',
    platform: 'cainiao',
  },
  {
    date: '2016-05-02',
    name: 'Iphone14 pro max  512G',
    address: 'No. 189, Grove St, Los Angeles',
    platform: 'cainiao',
  },
  {
    date: '2016-05-04',
    name: 'Iphone14 pro max  512G',
    address: 'No. 189, Grove St, Los Angeles',
    platform: 'doudian',
  },
  {
    date: '2016-05-01',
    name: 'Iphone14 pro max  512G',
    address: 'No. 189, Grove St, Los Angeles',
    platform: 'jingdong',
  },
  {
    date: '2016-05-08',
    name: 'Iphone14 pro max  512G',
    address: 'No. 189, Grove St, Los Angeles',
    platform: 'meituan',
  },
  {
    date: '2016-05-06',
    name: 'Iphone14 pro max  512G',
    address: 'No. 189, Grove St, Los Angeles',
    platform: 'pinduoduo',
  },
  {
    date: '2016-05-07',
    name: 'Iphone14 pro max  512G',
    address: 'No. 189, Grove St, Los Angeles',
    platform: 'kuaishou',
  },
];
const multipleSelection = ref<Order[]>([]);
const handleSelectionChange = (val: Order[]) => {
  multipleSelection.value = val;
};
const showProgress = ref(false);
const printers = ref<Array<string>>([]);
const printer = usePrinter();
const printerConnect = usePrinterConnectStatus();
const connects = computed(() => {
  return Object.keys(printerConnect.value || {}).map((k) => ({
    name: k,
    connect: printerConnect.value[k],
  }));
});
const connectings = ref<{ [k: string]: boolean }>({});
const printIdicator = ref({
  total: 0,
  current: 0,
});
const percentage = computed(() => {
  return ~~((printIdicator.value.current / printIdicator.value.total) * 100);
});
const printLogs = ref<string[]>([]);
const sleep = (tick = 500) =>
  new Promise((resolve) =>
    setTimeout(() => {
      return resolve(1);
    }, tick)
  );
const handlePrint = async () => {
  if (multipleSelection.value.length) {
    showProgress.value = true;
    printIdicator.value.total = multipleSelection.value.length;
    printIdicator.value.current = 0;
    multipleSelection.value.forEach(async (orderInfo) => {
      let task: PrintTask = {
        taskID: getUUID(),
      } as PrintTask;
      switch (orderInfo.platform) {
        case 'cainiao':
        case 'pinduoduo':
        case 'doudian':
        case 'kauishou':
        case 'meituan':
          task = {
            taskID: getUUID(),
            documents: [
              {
                documentID: '0123456789',
                contents: [
                  {
                    data: {
                      ...orderInfo,
                    },
                    templateURL: 'http://cloudprint.cainiao.com/template/standard/278250/1',
                  },
                ],
              },
            ],
          };
          break;
        case 'jingdong':
          task = {
            ...task,
            parameters: {
              printName: 'PDF24',
              contents: [
                {
                  dataType: 'app',
                  tempUrl: '标准模板2',
                  printData: '......数据2(明文)',
                  customTempUrl: '用户自定义区模板url',
                  customData: {
                    a: '123',
                    b: '456',
                    c: '789',
                  },
                },
              ],
            },
          };
          break;
      }

      const res = await printer.print(task, orderInfo.platform);
      console.log(printer.agentKeys);
      await sleep(2000);
      nextTick(() => {
        printIdicator.value.current++;
        printLogs.value.push(`[${orderInfo.platform}]打印任务:[${res.requestID}]-${res.msg}-【${orderInfo.name}】`);
        printLogs.value = printLogs.value.slice(-10);

        console.log('已发送到打印机', res.cmd, res.msg, res.success);
      });
    });
    multipleTableRef.value!.clearSelection();
  }
};

const reconnect = async (name: string) => {
  connectings.value[name] = true;
  console.log('reconnect', name);
  await printer.reconnect(name);
  console.log('reconnect', name, 'finish');
  await sleep(1000);
  connectings.value[name] = false;
};
onMounted(() => {
  setTimeout(() => {
    printer.getPrinters().then((res) => {
      printers.value = res.printers?.map((p) => p.name || '');
    });
  }, 10000);

  connectings.value = printer.isConnect;
});
</script>
<style scoped>
.list {
  margin: 0 auto;
  background-color: #fff;
}
.toolbar {
  display: flex;
  align-items: center;
  padding: 16px 8px;
  justify-content: flex-end;
  border-bottom: 1px solid #e8e8e8;
}
.toolbar > div {
  margin-left: 8px;
}
.toolbar > .status {
  flex: 1;
  overflow: hidden;
}
.connect-info {
  display: flex;
  padding: 8px 0;
  justify-content: space-between;
}
.connect-info > * {
  display: inline-block;
}
.connect-info > label {
  color: #606266;
  width: 100px;
}
.connect-info > span {
  color: #303133;
}
.connect-info > span.closed {
  color: #f89898;
}
.connect-info > span.opend {
  color: #529b2e;
}
.logs {
  overflow-y: auto;
  max-height: 400px;
  color: #606266;
}
</style>
