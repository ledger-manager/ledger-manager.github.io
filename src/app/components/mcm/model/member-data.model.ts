export interface MemberData {
  custNo: number;
  name_tel: string;
  name_en: string;
  village: string;
  mobileNo?: string;
  isActive?: boolean;
}

const villages = ['Vibhalapuram', 'Mamillagudem', 'Kothagudem'];

export const MEMBERS: MemberData[] = [
  {
    custNo: 1,
    name_tel: 'A. యల్లా రెడి',
    name_en: 'A. Yalla Reddy',
    village: villages[0],
  },
  {
    custNo: 2,
    name_tel: 'A.యాదగిరి',
    name_en: 'A. Yadagiri',
    village: villages[1],
  },
  {
    custNo: 3,
    name_tel: 'CH.లక్ష్మి',
    name_en: 'CH. Lakshmi',
    village: villages[2],
  },
  {
    custNo: 4,
    name_tel: 'D.రాములు',
    name_en: 'D. Ramulu',
    village: villages[0],
  },
  {
    custNo: 5,
    name_tel: 'G. గౌరమ్మ',
    name_en: 'G. Gouramma',
    village: villages[1],
  },
  {
    custNo: 6,
    name_tel: 'G. మంగమ్మ',
    name_en: 'G. Mangamma',
    village: villages[2],
  },
  {
    custNo: 7,
    name_tel: 'g. హనుమా రెడ్డి',
    name_en: 'g. Hanumantha Reddy',
    village: villages[0],
  },
  {
    custNo: 8,
    name_tel: 'K వెంకటేశ్వర్లు',
    name_en: 'K Venkateshwarlu',
    village: villages[1],
  },
  {
    custNo: 9,
    name_tel: 'K.నరసింహులు',
    name_en: 'K. Narasimhulu',
    village: villages[2],
  },
  {
    custNo: 10,
    name_tel: 'k.వెంకటరెడ్డి',
    name_en: 'k. Venkatareddy',
    village: villages[0],
  },
  {
    custNo: 11,
    name_tel: 'k.సుగుణమ్మ',
    name_en: 'k. Sugunamma',
    village: villages[1],
  },
  {
    custNo: 12,
    name_tel: 'm.లింగయ్య',
    name_en: 'm. Lingaiah',
    village: villages[2],
  },
  {
    custNo: 13,
    name_tel: 'N.తిరపయ్య',
    name_en: 'N. Tirupayya',
    village: villages[0],
  },
  {
    custNo: 14,
    name_tel: 'N.తిరుపతయ్య',
    name_en: 'N. Tirupataiah',
    village: villages[1],
  },
  {
    custNo: 15,
    name_tel: 'N.వి.భద్రమ్మ',
    name_en: 'N.V. Bhadramma',
    village: villages[2],
  },
  {
    custNo: 16,
    name_tel: 'T. మలయ్య',
    name_en: 'T. Malayya',
    village: villages[0],
  },
  {
    custNo: 17,
    name_tel: 'V.అంజయ్య',
    name_en: 'V. Anjaiah',
    village: villages[1],
  },
  {
    custNo: 18,
    name_tel: 'V.రాములు',
    name_en: 'V. Ramulu',
    village: villages[2],
  },
  {
    custNo: 19,
    name_tel: 'ఈశపాటి వెంకన్న',
    name_en: 'Ishapati Venkanna',
    village: villages[0],
  },
  {
    custNo: 20,
    name_tel: 'కొండపల్లి వెంకటరెడ్డి',
    name_en: 'Kondapalli Venkatareddy',
    village: villages[1],
  },
  {
    custNo: 21,
    name_tel: 'కొర్రా రమేష్',
    name_en: 'Korramesh',
    village: villages[2],
  },
  {
    custNo: 22,
    name_tel: 'నాగమణి',
    name_en: 'Nagamani',
    village: villages[0],
  },
  {
    custNo: 23,
    name_tel: 'నడి భద్రమ్మ',
    name_en: 'Nadi Bhadramma',
    village: villages[1],
  },
  {
    custNo: 24,
    name_tel: 'నరాల గోపయ్య',
    name_en: 'Narala Gopayya',
    village: villages[2],
  },
  {
    custNo: 25,
    name_tel: 'వీరబోయిన తింగయ్య',
    name_en: 'Veeraboyina Tingayya',
    village: villages[0],
  },
];
