require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, initDB } = require('./src/db');

const PASSWORD = 'Ratestore@1';

const storeOwners = [
  { name: 'Ramesh Kumar Agarwal',      email: 'ramesh.agarwal@ratestore.com',   address: '12 MG Road, Connaught Place, New Delhi 110001' },
  { name: 'Sunita Devi Sharma',        email: 'sunita.sharma@ratestore.com',    address: '45 Linking Road, Bandra West, Mumbai 400050' },
  { name: 'Vikram Singh Rajput',       email: 'vikram.rajput@ratestore.com',    address: '78 Brigade Road, Bengaluru 560001' },
  { name: 'Priya Nair Krishnamurthy',  email: 'priya.nair@ratestore.com',       address: '23 Anna Salai, Chennai 600002' },
  { name: 'Deepak Mohan Verma',        email: 'deepak.verma@ratestore.com',     address: '56 Hazratganj, Lucknow 226001' },
  { name: 'Anita Suresh Pillai',       email: 'anita.pillai@ratestore.com',     address: '9 Residency Road, Bengaluru 560025' },
];

const normalUsers = [
  { name: 'Rahul Pratap Singh',        email: 'rahul.singh@gmail.com',          address: '34 Shivaji Nagar, Pune 411005' },
  { name: 'Anjali Kumari Gupta',       email: 'anjali.gupta@gmail.com',         address: '89 Salt Lake City, Kolkata 700064' },
  { name: 'Amit Suresh Patel',         email: 'amit.patel@gmail.com',           address: '17 CG Road, Ahmedabad 380009' },
  { name: 'Pooja Rajesh Mehta',        email: 'pooja.mehta@gmail.com',          address: '66 Jawahar Nagar, Jaipur 302004' },
  { name: 'Sanjay Balram Yadav',       email: 'sanjay.yadav@gmail.com',         address: '11 Ashok Nagar, Bhopal 462003' },
  { name: 'Kavita Santosh Pandey',     email: 'kavita.pandey@gmail.com',        address: '55 Ramnagar Colony, Varanasi 221008' },
  { name: 'Arjun Dev Malhotra',        email: 'arjun.malhotra@gmail.com',       address: '29 Sector 17, Chandigarh 160017' },
  { name: 'Neha Vinod Joshi',          email: 'neha.joshi@gmail.com',           address: '43 Aundh Road, Pune 411007' },
  { name: 'Prakash Narayana Iyer',     email: 'prakash.iyer@gmail.com',         address: '7 T Nagar Main Road, Chennai 600017' },
  { name: 'Smita Dilip Kulkarni',      email: 'smita.kulkarni@gmail.com',       address: '82 FC Road, Shivajinagar, Pune 411004' },
  { name: 'Rohit Kishan Bansal',       email: 'rohit.bansal@gmail.com',         address: '14 Karol Bagh, New Delhi 110005' },
  { name: 'Divya Sunil Pillai',        email: 'divya.pillai@gmail.com',         address: '37 Indiranagar 100 Feet Road, Bengaluru 560038' },
  { name: 'Manish Gopal Srivastava',   email: 'manish.srivastava@gmail.com',    address: '92 Gomti Nagar, Lucknow 226010' },
  { name: 'Rekha Bharat Chaudhary',    email: 'rekha.chaudhary@gmail.com',      address: '61 Vastrapur Lake Road, Ahmedabad 380015' },
  { name: 'Suresh Laxman Nambiar',     email: 'suresh.nambiar@gmail.com',       address: '28 Kaloor Junction, Kochi 682017' },
];

const stores = [
  { name: 'Sharma General Store',                   email: 'sharma.general@stores.com',    address: '12 Gandhi Chowk, Connaught Place, New Delhi 110001',      ownerIdx: 0 },
  { name: 'Mumbai Fresh Fruits and Vegetables',     email: 'mumbai.fresh@stores.com',       address: '45 Dadar Market, Dadar West, Mumbai 400028',              ownerIdx: 1 },
  { name: 'Bengaluru Electronics Hub',              email: 'blr.electronics@stores.com',    address: '78 Commercial Street, Bengaluru 560001',                  ownerIdx: 2 },
  { name: 'Chennai Saree Emporium',                 email: 'chennai.saree@stores.com',      address: '23 Pondy Bazaar, T Nagar, Chennai 600017',                ownerIdx: 3 },
  { name: 'Lucknow Chikan Craft House',             email: 'lucknow.chikan@stores.com',     address: '56 Aminabad Market, Lucknow 226018',                      ownerIdx: 4 },
  { name: 'Patel Dairy and Sweets Corner',          email: 'patel.dairy@stores.com',        address: '89 Law Garden, Navrangpura, Ahmedabad 380006',            ownerIdx: null },
  { name: 'Rajasthani Handicrafts Bazaar',          email: 'raj.handicrafts@stores.com',    address: '17 Johari Bazaar, Pink City, Jaipur 302003',              ownerIdx: null },
  { name: 'Kolkata Book Palace',                    email: 'kolkata.books@stores.com',      address: '11 College Street, Bowbazar, Kolkata 700073',             ownerIdx: null },
  { name: 'Pillai South Indian Cuisine',            email: 'pillai.cuisine@stores.com',     address: '9 Residency Road, Shivajinagar, Bengaluru 560025',        ownerIdx: 5 },
  { name: 'Himalayan Organic Spices',               email: 'himalayan.spices@stores.com',   address: '4 Paltan Bazaar, Dehradun 248001',                        ownerIdx: null },
];

// [userIdx, storeIdx, rating, daysAgo]
const ratingsData = [
  [0,0,5,1],[0,1,4,3],[0,2,3,7],[0,5,5,2],[0,8,4,5],
  [1,0,4,2],[1,2,5,4],[1,3,4,1],[1,6,3,8],[1,9,5,3],
  [2,1,3,5],[2,3,5,2],[2,4,4,6],[2,7,5,1],[2,5,4,9],
  [3,0,5,3],[3,2,4,7],[3,5,3,2],[3,6,4,4],[3,8,5,1],
  [4,1,4,6],[4,3,3,3],[4,4,5,8],[4,7,4,2],[4,9,3,5],
  [5,0,3,4],[5,2,5,1],[5,6,4,9],[5,7,5,3],[5,1,4,6],
  [6,1,5,2],[6,3,4,5],[6,4,3,7],[6,5,4,1],[6,0,2,8],
  [7,0,4,1],[7,2,3,4],[7,3,5,6],[7,6,5,2],[7,8,4,10],
  [8,1,5,3],[8,4,4,5],[8,5,3,2],[8,7,4,7],[8,9,5,1],
  [9,0,4,8],[9,2,5,2],[9,3,3,4],[9,4,5,6],[9,6,4,3],
  [10,1,3,1],[10,5,5,7],[10,6,4,3],[10,7,3,5],[10,8,5,2],
  [11,0,5,4],[11,3,4,1],[11,4,3,6],[11,6,5,2],[11,9,4,8],
  [12,1,4,5],[12,2,5,3],[12,5,3,7],[12,8,4,1],[12,0,3,9],
  [13,3,5,2],[13,4,4,4],[13,7,5,6],[13,9,3,1],[13,1,4,8],
  [14,0,4,3],[14,2,3,5],[14,5,5,2],[14,6,4,7],[14,8,5,4],
];

async function seed() {
  await initDB();
  const client = await pool.connect();
  try {
    console.log('\n🌱  Seeding database...\n');
    const hash = await bcrypt.hash(PASSWORD, 12);

    const ownerIds = [];
    for (const u of storeOwners) {
      const ex = await client.query('SELECT id FROM users WHERE email=$1',[u.email]);
      if (ex.rows.length>0) { ownerIds.push(ex.rows[0].id); console.log(`  ⏭  ${u.name}`); continue; }
      const r = await client.query(
        `INSERT INTO users (name,email,password,address,role) VALUES ($1,$2,$3,$4,'store_owner') RETURNING id`,
        [u.name,u.email,hash,u.address]
      );
      ownerIds.push(r.rows[0].id);
      console.log(`  ✅ Store Owner : ${u.name}`);
    }

    const userIds = [];
    for (const u of normalUsers) {
      const ex = await client.query('SELECT id FROM users WHERE email=$1',[u.email]);
      if (ex.rows.length>0) { userIds.push(ex.rows[0].id); console.log(`  ⏭  ${u.name}`); continue; }
      const r = await client.query(
        `INSERT INTO users (name,email,password,address,role) VALUES ($1,$2,$3,$4,'user') RETURNING id`,
        [u.name,u.email,hash,u.address]
      );
      userIds.push(r.rows[0].id);
      console.log(`  ✅ Normal User  : ${u.name}`);
    }

    const storeIds = [];
    for (const s of stores) {
      const ex = await client.query('SELECT id FROM stores WHERE email=$1',[s.email]);
      if (ex.rows.length>0) { storeIds.push(ex.rows[0].id); console.log(`  ⏭  ${s.name}`); continue; }
      const ownerId = s.ownerIdx!==null ? ownerIds[s.ownerIdx] : null;
      const r = await client.query(
        `INSERT INTO stores (name,email,address,owner_id) VALUES ($1,$2,$3,$4) RETURNING id`,
        [s.name,s.email,s.address,ownerId]
      );
      storeIds.push(r.rows[0].id);
      console.log(`  ✅ Store        : ${s.name}`);
    }

    console.log('');
    let inserted = 0;
    for (const [uIdx,sIdx,rating,daysAgo] of ratingsData) {
      const userId=userIds[uIdx], storeId=storeIds[sIdx];
      if (!userId||!storeId) continue;
      const createdAt = new Date(Date.now() - daysAgo*24*60*60*1000);
      await client.query(
        `INSERT INTO ratings (store_id,user_id,rating,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$4)
         ON CONFLICT (store_id,user_id) DO NOTHING`,
        [storeId,userId,rating,createdAt]
      );
      inserted++;
    }
    console.log(`  ✅ ${inserted} ratings inserted (spread across last 10 days)`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ✅  Seed complete!');
    console.log('\n  All seeded accounts password:  Ratestore@1');
    console.log('  Admin login:  admin@ratestore.com  /  Admin@123');
    console.log('  Owner login:  ramesh.agarwal@ratestore.com  /  Ratestore@1');
    console.log('  User login:   rahul.singh@gmail.com  /  Ratestore@1');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } finally { client.release(); await pool.end(); }
}

seed().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
