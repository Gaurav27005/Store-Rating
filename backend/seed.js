require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, initDB } = require('./src/db');

const PASSWORD = 'Ratestore@1';

// Added 4 new Store Owners so every store has an assigned owner
const storeOwners = [
  { name: 'Ramesh Kumar Agarwal',      email: 'ramesh.agarwal@ratestore.com',   address: '12 MG Road, Connaught Place, New Delhi 110001' },
  { name: 'Sunita Devi Sharma',        email: 'sunita.sharma@ratestore.com',    address: '45 Linking Road, Bandra West, Mumbai 400050' },
  { name: 'Vikram Singh Rajput',       email: 'vikram.rajput@ratestore.com',    address: '78 Brigade Road, Bengaluru 560001' },
  { name: 'Priya Nair Krishnamurthy',  email: 'priya.nair@ratestore.com',       address: '23 Anna Salai, Chennai 600002' },
  { name: 'Deepak Mohan Verma',        email: 'deepak.verma@ratestore.com',     address: '56 Hazratganj, Lucknow 226001' },
  { name: 'Anita Suresh Pillai',       email: 'anita.pillai@ratestore.com',     address: '9 Residency Road, Bengaluru 560025' },
  { name: 'Bhavik Patel',              email: 'bhavik.patel@ratestore.com',     address: '89 Law Garden, Navrangpura, Ahmedabad 380006' },
  { name: 'Rajendra Singh',            email: 'rajendra.singh@ratestore.com',   address: '17 Johari Bazaar, Pink City, Jaipur 302003' },
  { name: 'Subhash Bose',              email: 'subhash.bose@ratestore.com',     address: '11 College Street, Bowbazar, Kolkata 700073' },
  { name: 'Anil Bisht',                email: 'anil.bisht@ratestore.com',       address: '4 Paltan Bazaar, Dehradun 248001' },
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

// Assigned all stores to the new owners
const stores = [
  { name: 'Sharma General Store',                   email: 'sharma.general@stores.com',    address: '12 Gandhi Chowk, Connaught Place, New Delhi 110001',      ownerIdx: 0 },
  { name: 'Mumbai Fresh Fruits and Vegetables',     email: 'mumbai.fresh@stores.com',      address: '45 Dadar Market, Dadar West, Mumbai 400028',              ownerIdx: 1 },
  { name: 'Bengaluru Electronics Hub',              email: 'blr.electronics@stores.com',   address: '78 Commercial Street, Bengaluru 560001',                  ownerIdx: 2 },
  { name: 'Chennai Saree Emporium',                 email: 'chennai.saree@stores.com',     address: '23 Pondy Bazaar, T Nagar, Chennai 600017',                ownerIdx: 3 },
  { name: 'Lucknow Chikan Craft House',             email: 'lucknow.chikan@stores.com',    address: '56 Aminabad Market, Lucknow 226018',                      ownerIdx: 4 },
  { name: 'Patel Dairy and Sweets Corner',          email: 'patel.dairy@stores.com',       address: '89 Law Garden, Navrangpura, Ahmedabad 380006',            ownerIdx: 6 },
  { name: 'Rajasthani Handicrafts Bazaar',          email: 'raj.handicrafts@stores.com',   address: '17 Johari Bazaar, Pink City, Jaipur 302003',              ownerIdx: 7 },
  { name: 'Kolkata Book Palace',                    email: 'kolkata.books@stores.com',     address: '11 College Street, Bowbazar, Kolkata 700073',             ownerIdx: 8 },
  { name: 'Pillai South Indian Cuisine',            email: 'pillai.cuisine@stores.com',    address: '9 Residency Road, Shivajinagar, Bengaluru 560025',        ownerIdx: 5 },
  { name: 'Himalayan Organic Spices',               email: 'himalayan.spices@stores.com',  address: '4 Paltan Bazaar, Dehradun 248001',                        ownerIdx: 9 },
];

// [userIdx, storeIdx, rating, daysAgo, feedback]
const ratingsData = [
  [0,0,5,1, "Fantastic general store, they have everything I need for my daily groceries."],
  [0,1,4,3, "Great fresh fruits, slightly overpriced though."],
  [0,2,3,7, null],
  [0,5,5,2, "Best sweets in town! Highly recommend the peda."],
  [0,8,4,5, "Good South Indian food, very authentic taste."],
  
  [1,0,4,2, "Nice store, friendly owner."],
  [1,2,5,4, "Excellent electronics hub, got my laptop repaired here quickly."],
  [1,3,4,1, "Beautiful sarees and friendly staff."],
  [1,6,3,8, null],
  [1,9,5,3, "The spices are incredibly aromatic and fresh!"],
  
  [2,1,3,5, "Vegetables were fresh but the shop was very crowded."],
  [2,3,5,2, "Loved the silk collection here, purchased 3 sarees for a wedding."],
  [2,4,4,6, "Good chikan work, bargaining is a must."],
  [2,7,5,1, "Amazing collection of books, an absolute paradise for readers!"],
  [2,5,4,9, null],
  
  [3,0,5,3, "Always my go-to store for daily needs."],
  [3,2,4,7, "Good variety of electronics, bought a great pair of headphones."],
  [3,5,3,2, "Sweets are okay, but dairy products are very fresh."],
  [3,6,4,4, "Bought some lovely decorative items for my living room."],
  [3,8,5,1, "The dosas here are simply the best. Crisp and perfect."],
  
  [4,1,4,6, null],
  [4,3,3,3, "Average experience, collection could be better."],
  [4,4,5,8, "Top notch embroidery work. Definitely coming back next month."],
  [4,7,4,2, "Great place to find old and rare books."],
  [4,9,3,5, null],
  
  [5,0,3,4, "Decent store, sometimes runs out of stock of standard items."],
  [5,2,5,1, "Very helpful staff, helped me choose the right phone."],
  [5,6,4,9, null],
  [5,7,5,3, "A treasure trove for book lovers!"],
  [5,1,4,6, "Fresh vegetables, highly recommended."],
  
  [6,1,5,2, "Always rely on this shop for the freshest mangoes in summer."],
  [6,3,4,5, null],
  [6,4,3,7, "A bit hard to find in the market, but decent quality."],
  [6,5,4,1, "Love their fresh paneer."],
  [6,0,2,8, "The queue at the billing counter was too long."],
  
  [7,0,4,1, null],
  [7,2,3,4, "Prices are slightly higher than online stores."],
  [7,3,5,6, "The owner was very patient and showed us multiple options."],
  [7,6,5,2, "Beautiful handcrafted items, bought a Rajasthani umbrella."],
  [7,8,4,10, null],
  
  [8,1,5,3, "Best place in Dadar for fresh produce."],
  [8,4,4,5, "The Kurtas are very comfortable and stylish."],
  [8,5,3,2, null],
  [8,7,4,7, "Found some great academic books here at a discount."],
  [8,9,5,1, "The Himalayan pink salt is very pure."],
  
  [9,0,4,8, null],
  [9,2,5,2, "Great customer service!"],
  [9,3,3,4, "Colors didn't match the photos on their catalog, but still nice."],
  [9,4,5,6, "Absolutely stunning craftsmanship."],
  [9,6,4,3, null],
];

async function seed() {
  await initDB();
  const client = await pool.connect();
  try {
    console.log('\n🌱  Seeding database...\n');
    const hash = await bcrypt.hash(PASSWORD, 12);

    // Seeding Owners
    const ownerIds = [];
    for (const u of storeOwners) {
      const ex = await client.query('SELECT id FROM users WHERE email=$1',[u.email]);
      if (ex.rows.length>0) { 
        ownerIds.push(ex.rows[0].id); 
        console.log(`  ⏭  Owner exists: ${u.name}`); 
        continue; 
      }
      const r = await client.query(
        `INSERT INTO users (name,email,password,address,role) VALUES ($1,$2,$3,$4,'store_owner') RETURNING id`,
        [u.name,u.email,hash,u.address]
      );
      ownerIds.push(r.rows[0].id);
      console.log(`  ✅ Store Owner : ${u.name}`);
    }

    // Seeding Normal Users
    const userIds = [];
    for (const u of normalUsers) {
      const ex = await client.query('SELECT id FROM users WHERE email=$1',[u.email]);
      if (ex.rows.length>0) { 
        userIds.push(ex.rows[0].id); 
        console.log(`  ⏭  User exists:  ${u.name}`); 
        continue; 
      }
      const r = await client.query(
        `INSERT INTO users (name,email,password,address,role) VALUES ($1,$2,$3,$4,'user') RETURNING id`,
        [u.name,u.email,hash,u.address]
      );
      userIds.push(r.rows[0].id);
      console.log(`  ✅ Normal User : ${u.name}`);
    }

    // Seeding Stores (and updating owners if missing from previous run)
    const storeIds = [];
    for (const s of stores) {
      const ownerId = s.ownerIdx!==null ? ownerIds[s.ownerIdx] : null;
      const ex = await client.query('SELECT id FROM stores WHERE email=$1',[s.email]);
      
      if (ex.rows.length > 0) { 
        // Update the owner ID in case it was null from an old seed run
        await client.query('UPDATE stores SET owner_id=$1 WHERE id=$2', [ownerId, ex.rows[0].id]);
        storeIds.push(ex.rows[0].id); 
        console.log(`  🔄  Updated Store: ${s.name} (Assigned Owner)`); 
        continue; 
      }
      
      const r = await client.query(
        `INSERT INTO stores (name,email,address,owner_id) VALUES ($1,$2,$3,$4) RETURNING id`,
        [s.name,s.email,s.address,ownerId]
      );
      storeIds.push(r.rows[0].id);
      console.log(`  ✅ Store Added : ${s.name}`);
    }

    // Seeding Ratings and Feedback
    console.log('');
    let inserted = 0;
    for (const [uIdx, sIdx, rating, daysAgo, feedback] of ratingsData) {
      const userId = userIds[uIdx], storeId = storeIds[sIdx];
      if (!userId || !storeId) continue;
      
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      // UPSERT: If rating exists, update it with the new text feedback.
      await client.query(
        `INSERT INTO ratings (store_id, user_id, rating, feedback, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $5)
         ON CONFLICT (store_id, user_id) 
         DO UPDATE SET rating = EXCLUDED.rating, feedback = EXCLUDED.feedback, updated_at = EXCLUDED.updated_at`,
        [storeId, userId, rating, feedback || null, createdAt]
      );
      inserted++;
    }
    console.log(`  ✅ ${inserted} ratings & feedback comments processed`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ✅  Seed complete!');
    console.log('\n  All seeded accounts password:  Ratestore@1');
    console.log('  Admin login:  admin@ratestore.com  /  Admin@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } finally { 
    client.release(); 
    await pool.end(); 
  }
}

seed().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });