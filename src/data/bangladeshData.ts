export interface BangladeshDistrict {
  id: string;
  name: string;
}

export interface BangladeshThana {
  id: string;
  districtId: string;
  name: string;
}

export interface BangladeshUnion {
  id: string;
  thanaId: string;
  name: string;
}

export const BANGLADESH_DISTRICTS: BangladeshDistrict[] = [
  { id: 'dhaka', name: 'Dhaka' },
  { id: 'chittagong', name: 'Chittagong' },
  { id: 'sylhet', name: 'Sylhet' },
  { id: 'rajshahi', name: 'Rajshahi' },
  { id: 'barisal', name: 'Barisal' },
  { id: 'khulna', name: 'Khulna' },
];

export const BANGLADESH_THANAS: BangladeshThana[] = [
  // Dhaka thanas
  { id: 'keraniganj_south', districtId: 'dhaka', name: 'South Keraniganj' },
  { id: 'keraniganj_north', districtId: 'dhaka', name: 'North Keraniganj' },
  { id: 'mirpur', districtId: 'dhaka', name: 'Mirpur' },
  { id: 'dhanmondi', districtId: 'dhaka', name: 'Dhanmondi' },
  { id: 'savar', districtId: 'dhaka', name: 'Savar' },

  // Chittagong thanas
  { id: 'panchlaish', districtId: 'chittagong', name: 'Panchlaish' },
  { id: 'kotwali', districtId: 'chittagong', name: 'Kotwali' },
  { id: 'hathazari', districtId: 'chittagong', name: 'Hathazari' },

  // Sylhet thanas
  { id: 'sylhet_sadar', districtId: 'sylhet', name: 'Sylhet Sadar' },
  { id: 'beanibazar', districtId: 'sylhet', name: 'Beanibazar' },
];

export const BANGLADESH_UNIONS: BangladeshUnion[] = [
  // South Keraniganj unions
  { id: 'shuvadda', thanaId: 'keraniganj_south', name: 'Shuvadda (Khalab Base)' },
  { id: 'teghoria', thanaId: 'keraniganj_south', name: 'Teghoria' },
  { id: 'konda', thanaId: 'keraniganj_south', name: 'Konda' },
  { id: 'basta', thanaId: 'keraniganj_south', name: 'Basta' },
  { id: 'shakta', thanaId: 'keraniganj_south', name: 'Shakta' },

  // North Keraniganj unions
  { id: 'ruhitpur', thanaId: 'keraniganj_north', name: 'Ruhitpur' },
  { id: 'kalindi', thanaId: 'keraniganj_north', name: 'Kalindi' },

  // Mirpur unions
  { id: 'mirpur_sec1', thanaId: 'mirpur', name: 'Section 1' },
  { id: 'mirpur_sec10', thanaId: 'mirpur', name: 'Section 10' },

  // Savar unions
  { id: 'aminbazar', thanaId: 'savar', name: 'Amin Bazar' },
  { id: 'ashulia', thanaId: 'savar', name: 'Ashulia' },

  // Panchlaish
  { id: 'panch_ward1', thanaId: 'panchlaish', name: 'Ward No 1' },
  { id: 'panch_ward2', thanaId: 'panchlaish', name: 'Ward No 2' },

  // Sylhet Sadar
  { id: 'moglabazar', thanaId: 'sylhet_sadar', name: 'Mogla Bazar' },
  { id: 'tukur_bazar', thanaId: 'sylhet_sadar', name: 'Tukur Bazar' },
];
