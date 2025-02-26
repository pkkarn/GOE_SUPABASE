// Mock data for demonstration
export const mockYugas = [
  {
    id: 1,
    name: "Spiritual Growth",
    targetPoints: 1000,
    currentPoints: 245.6,
    bonusTasks: [
      { id: 1, name: "Complete 30 days meditation", points: 50, completed: false },
      { id: 2, name: "Read 5 spiritual books", points: 30, completed: true }
    ],
    entries: [
      { id: 1, date: "2024-03-10", totalHours: 3.5, points: 0.7 },
      { id: 2, date: "2024-03-11", totalHours: 2.6, points: 0.52 },
      { id: 3, date: "2024-03-12", totalHours: 0, points: -1 }
    ]
  },
  {
    id: 2,
    name: "Physical Mastery",
    targetPoints: 800,
    currentPoints: 156.8,
    bonusTasks: [
      { id: 3, name: "Run a marathon", points: 100, completed: false },
      { id: 4, name: "30 days workout streak", points: 50, completed: false }
    ],
    entries: [
      { id: 4, date: "2024-03-10", totalHours: 2.8, points: 0.56 },
      { id: 5, date: "2024-03-11", totalHours: 1.5, points: 0 },
      { id: 6, date: "2024-03-12", totalHours: 3.2, points: 0.64 }
    ]
  }
];

export const mockStats = {
  totalPoints: 402.4,
  totalYugas: 2,
  completedBonusTasks: 1,
  consistencyStreak: 5,
  pointsHistory: [
    { date: "2024-03-12", points: -0.36 },
    { date: "2024-03-11", points: 0.52 },
    { date: "2024-03-10", points: 1.26 },
    { date: "2024-03-09", points: 0.84 },
    { date: "2024-03-08", points: 0.92 }
  ]
};