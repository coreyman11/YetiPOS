
export const TIME_RANGES = {
  today: {
    label: "Today",
    getDates: () => {
      const now = new Date();
      return {
        startDate: new Date(now.setHours(0, 0, 0, 0)),
        endDate: new Date(now.setHours(23, 59, 59, 999)),
      };
    },
  },
  yesterday: {
    label: "Yesterday",
    getDates: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: new Date(yesterday.setHours(0, 0, 0, 0)),
        endDate: new Date(yesterday.setHours(23, 59, 59, 999)),
      };
    },
  },
  thisWeek: {
    label: "This Week",
    getDates: () => {
      const now = new Date();
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      return {
        startDate: new Date(firstDay.setHours(0, 0, 0, 0)),
        endDate: new Date(lastDay.setHours(23, 59, 59, 999)),
      };
    },
  },
  thisMonth: {
    label: "This Month",
    getDates: () => {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        startDate: new Date(firstDay.setHours(0, 0, 0, 0)),
        endDate: new Date(lastDay.setHours(23, 59, 59, 999)),
      };
    },
  },
  lastMonth: {
    label: "Last Month",
    getDates: () => {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: new Date(firstDay.setHours(0, 0, 0, 0)),
        endDate: new Date(lastDay.setHours(23, 59, 59, 999)),
      };
    },
  },
};
