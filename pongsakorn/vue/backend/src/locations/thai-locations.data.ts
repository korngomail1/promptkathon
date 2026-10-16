import type { LocationRef } from '../types';

/**
 * พื้นที่ตั้งต้นสำหรับปุ่มเลือกพื้นที่ — เน้นจังหวัดใหญ่และพื้นที่เสี่ยงน้ำท่วมซ้ำซาก
 * ใช้เป็นทั้งรายการแนะนำ และเป็นตัวสำรองเวลา reverse geocode ภายนอกล่ม
 */
export const THAI_LOCATIONS: LocationRef[] = [
  { id: 'th-bangkok', name: 'กรุงเทพมหานคร', admin1: 'กรุงเทพมหานคร', country: 'ไทย', latitude: 13.7563, longitude: 100.5018 },
  { id: 'th-nonthaburi', name: 'นนทบุรี', admin1: 'นนทบุรี', country: 'ไทย', latitude: 13.8591, longitude: 100.5217 },
  { id: 'th-pathumthani', name: 'ปทุมธานี', admin1: 'ปทุมธานี', country: 'ไทย', latitude: 14.0208, longitude: 100.5250 },
  { id: 'th-samutprakan', name: 'สมุทรปราการ', admin1: 'สมุทรปราการ', country: 'ไทย', latitude: 13.5991, longitude: 100.5998 },
  { id: 'th-ayutthaya', name: 'พระนครศรีอยุธยา', admin1: 'พระนครศรีอยุธยา', country: 'ไทย', latitude: 14.3532, longitude: 100.5689 },
  { id: 'th-angthong', name: 'อ่างทอง', admin1: 'อ่างทอง', country: 'ไทย', latitude: 14.5896, longitude: 100.4550 },
  { id: 'th-singburi', name: 'สิงห์บุรี', admin1: 'สิงห์บุรี', country: 'ไทย', latitude: 14.8907, longitude: 100.3967 },
  { id: 'th-chainat', name: 'ชัยนาท', admin1: 'ชัยนาท', country: 'ไทย', latitude: 15.1851, longitude: 100.1251 },
  { id: 'th-nakhonsawan', name: 'นครสวรรค์', admin1: 'นครสวรรค์', country: 'ไทย', latitude: 15.7047, longitude: 100.1372 },
  { id: 'th-sukhothai', name: 'สุโขทัย', admin1: 'สุโขทัย', country: 'ไทย', latitude: 17.0061, longitude: 99.8265 },
  { id: 'th-phitsanulok', name: 'พิษณุโลก', admin1: 'พิษณุโลก', country: 'ไทย', latitude: 16.8211, longitude: 100.2659 },
  { id: 'th-chiangmai', name: 'เชียงใหม่', admin1: 'เชียงใหม่', country: 'ไทย', latitude: 18.7883, longitude: 98.9853 },
  { id: 'th-chiangrai', name: 'เชียงราย', admin1: 'เชียงราย', country: 'ไทย', latitude: 19.9105, longitude: 99.8406 },
  { id: 'th-lampang', name: 'ลำปาง', admin1: 'ลำปาง', country: 'ไทย', latitude: 18.2888, longitude: 99.4909 },
  { id: 'th-nan', name: 'น่าน', admin1: 'น่าน', country: 'ไทย', latitude: 18.7756, longitude: 100.7730 },
  { id: 'th-udonthani', name: 'อุดรธานี', admin1: 'อุดรธานี', country: 'ไทย', latitude: 17.4138, longitude: 102.7870 },
  { id: 'th-khonkaen', name: 'ขอนแก่น', admin1: 'ขอนแก่น', country: 'ไทย', latitude: 16.4419, longitude: 102.8360 },
  { id: 'th-ubon', name: 'อุบลราชธานี', admin1: 'อุบลราชธานี', country: 'ไทย', latitude: 15.2448, longitude: 104.8473 },
  { id: 'th-nakhonratchasima', name: 'นครราชสีมา', admin1: 'นครราชสีมา', country: 'ไทย', latitude: 14.9799, longitude: 102.0978 },
  { id: 'th-chonburi', name: 'ชลบุรี', admin1: 'ชลบุรี', country: 'ไทย', latitude: 13.3611, longitude: 100.9847 },
  { id: 'th-rayong', name: 'ระยอง', admin1: 'ระยอง', country: 'ไทย', latitude: 12.6814, longitude: 101.2816 },
  { id: 'th-chanthaburi', name: 'จันทบุรี', admin1: 'จันทบุรี', country: 'ไทย', latitude: 12.6113, longitude: 102.1039 },
  { id: 'th-trat', name: 'ตราด', admin1: 'ตราด', country: 'ไทย', latitude: 12.2428, longitude: 102.5175 },
  { id: 'th-phetchaburi', name: 'เพชรบุรี', admin1: 'เพชรบุรี', country: 'ไทย', latitude: 13.1119, longitude: 99.9399 },
  { id: 'th-prachuap', name: 'ประจวบคีรีขันธ์', admin1: 'ประจวบคีรีขันธ์', country: 'ไทย', latitude: 11.8126, longitude: 99.7957 },
  { id: 'th-chumphon', name: 'ชุมพร', admin1: 'ชุมพร', country: 'ไทย', latitude: 10.4930, longitude: 99.1800 },
  { id: 'th-suratthani', name: 'สุราษฎร์ธานี', admin1: 'สุราษฎร์ธานี', country: 'ไทย', latitude: 9.1382, longitude: 99.3215 },
  { id: 'th-nakhonsithammarat', name: 'นครศรีธรรมราช', admin1: 'นครศรีธรรมราช', country: 'ไทย', latitude: 8.4304, longitude: 99.9631 },
  { id: 'th-phuket', name: 'ภูเก็ต', admin1: 'ภูเก็ต', country: 'ไทย', latitude: 7.8804, longitude: 98.3923 },
  { id: 'th-krabi', name: 'กระบี่', admin1: 'กระบี่', country: 'ไทย', latitude: 8.0863, longitude: 98.9063 },
  { id: 'th-trang', name: 'ตรัง', admin1: 'ตรัง', country: 'ไทย', latitude: 7.5593, longitude: 99.6110 },
  { id: 'th-songkhla', name: 'สงขลา', admin1: 'สงขลา', country: 'ไทย', latitude: 7.1897, longitude: 100.5954 },
  { id: 'th-hatyai', name: 'หาดใหญ่', admin1: 'สงขลา', country: 'ไทย', latitude: 7.0086, longitude: 100.4747 },
  { id: 'th-pattani', name: 'ปัตตานี', admin1: 'ปัตตานี', country: 'ไทย', latitude: 6.8692, longitude: 101.2550 },
  { id: 'th-yala', name: 'ยะลา', admin1: 'ยะลา', country: 'ไทย', latitude: 6.5410, longitude: 101.2800 },
  { id: 'th-narathiwat', name: 'นราธิวาส', admin1: 'นราธิวาส', country: 'ไทย', latitude: 6.4254, longitude: 101.8253 },
];

/** ระยะทางวงกลมใหญ่ระหว่างสองพิกัด (กิโลเมตร) */
export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearestThaiLocation(lat: number, lon: number): LocationRef {
  let best = THAI_LOCATIONS[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of THAI_LOCATIONS) {
    const distance = haversineKm(lat, lon, candidate.latitude, candidate.longitude);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  return { ...best, distanceKm: Math.round(bestDistance * 10) / 10 };
}
