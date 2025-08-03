const bcrypt = require('bcryptjs');

async function testPasswordHashing() {
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 12);
  
  console.log('Original password:', password);
  console.log('Hashed password:', hashedPassword);
  
  const isValid = await bcrypt.compare(password, hashedPassword);
  console.log('Password validation:', isValid);
  
  const isInvalid = await bcrypt.compare('wrongpassword', hashedPassword);
  console.log('Wrong password validation:', isInvalid);
}

testPasswordHashing().catch(console.error);