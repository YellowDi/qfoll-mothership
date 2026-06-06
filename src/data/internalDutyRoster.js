import { dutyCalendarByYear } from "./dutyCalendarByYear";

export const dutyRosterConfig = {
  pageTitle: "值日表",
  subtitle: "公司内部使用",
  routeHint: "此页面未加入站点导航，仅通过链接访问。",
  rotationStartDate: "2026-03-09",
  members: [
    "孙想艺",
    "张启恒",
    "黄迪",
    "李哲岭",
    "尤佳晨",
    "邵静旭",
    "梁何羽戈",
    "杨明琪",
  ],
  calendarByYear: dutyCalendarByYear,
  overrides: {},
  notes: [
    "名单会先随机排序一次，再按排班日顺序每天一人轮值，全部排完一遍后才进入下一轮。",
    "节假日、调休上班日按年度日历维护，默认以 ChinaCalendar 为基础并允许公司内部补充。",
    "如遇临时换人，可直接在 overrides 中指定日期负责人。",
    "需要更换名单时，编辑此文件即可。",
  ],
};
