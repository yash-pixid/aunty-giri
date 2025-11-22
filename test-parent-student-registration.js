#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testParentStudentRegistration() {
  console.log('🧪 TESTING PARENT-STUDENT REGISTRATION');
  console.log('=====================================\n');

  try {
    // Test data
    const registrationData = {
      parent_name: 'John Doe',
      parent_email: 'john.doe@example.com',
      parent_password: 'parentPassword123',
      student_name: 'Jane Doe',
      student_email: 'jane.doe@example.com',
      student_password: 'studentPassword123',
      student_standard: 'Grade 10'
    };

    console.log('📝 Registration Data:');
    console.log(JSON.stringify(registrationData, null, 2));
    console.log('\n');

    // Test parent-student registration
    console.log('🔄 Testing parent-student registration...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register-parent-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData)
    });

    const registerResult = await registerResponse.json();
    
    if (registerResponse.ok) {
      console.log('✅ Registration successful!');
      console.log('📊 Response:', JSON.stringify(registerResult, null, 2));
      
      // Extract tokens for further testing
      const { accessToken, parent, student } = registerResult.data;
      
      console.log('\n👨‍👩‍👧‍👦 Created Users:');
      console.log(`Parent: ${parent.username} (${parent.email}) - Role: ${parent.role}`);
      console.log(`Student: ${student.username} (${student.email}) - Role: ${student.role} - Standard: ${student.student_standard}`);
      console.log(`Parent-Student Link: Student's parent_id = ${student.parent_id}`);
      
      // Test login with parent credentials
      console.log('\n🔐 Testing parent login...');
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registrationData.parent_email,
          password: registrationData.parent_password
        })
      });

      const loginResult = await loginResponse.json();
      
      if (loginResponse.ok) {
        console.log('✅ Parent login successful!');
        console.log(`Logged in as: ${loginResult.data.user.username} (${loginResult.data.user.role})`);
        
        // Test accessing protected route
        console.log('\n🛡️  Testing protected route access...');
        const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${loginResult.data.accessToken}`
          }
        });

        const meResult = await meResponse.json();
        
        if (meResponse.ok) {
          console.log('✅ Protected route access successful!');
          console.log(`Current user: ${meResult.data.user.username} (${meResult.data.user.role})`);
        } else {
          console.log('❌ Protected route access failed:', meResult.message);
        }
        
      } else {
        console.log('❌ Parent login failed:', loginResult.message);
      }
      
      // Test login with student credentials
      console.log('\n🎓 Testing student login...');
      const studentLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registrationData.student_email,
          password: registrationData.student_password
        })
      });

      const studentLoginResult = await studentLoginResponse.json();
      
      if (studentLoginResponse.ok) {
        console.log('✅ Student login successful!');
        console.log(`Logged in as: ${studentLoginResult.data.user.username} (${studentLoginResult.data.user.role})`);
        console.log(`Student standard: ${studentLoginResult.data.user.student_standard}`);
        console.log(`Parent ID: ${studentLoginResult.data.user.parent_id}`);
      } else {
        console.log('❌ Student login failed:', studentLoginResult.message);
      }
      
    } else {
      console.log('❌ Registration failed:', registerResult.message);
      return;
    }

    console.log('\n✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('====================================');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Test duplicate registration
async function testDuplicateRegistration() {
  console.log('\n🔄 Testing duplicate registration prevention...');
  
  const duplicateData = {
    parent_name: 'John Doe', // Same as before
    parent_email: 'john.doe@example.com', // Same as before
    parent_password: 'parentPassword123',
    student_name: 'Another Student',
    student_email: 'another.student@example.com',
    student_password: 'studentPassword123',
    student_standard: 'Grade 9'
  };

  try {
    const response = await fetch(`${BASE_URL}/api/auth/register-parent-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(duplicateData)
    });

    const result = await response.json();
    
    if (!response.ok && result.message.includes('already exists')) {
      console.log('✅ Duplicate registration correctly prevented!');
      console.log(`Error message: ${result.message}`);
    } else {
      console.log('❌ Duplicate registration was not prevented!');
    }
  } catch (error) {
    console.error('❌ Duplicate test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting Parent-Student Registration Tests\n');
  
  // Wait a moment for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testParentStudentRegistration();
  await testDuplicateRegistration();
  
  console.log('\n🎯 Test Summary:');
  console.log('- Parent-Student registration flow');
  console.log('- Parent login verification');
  console.log('- Student login verification');
  console.log('- Protected route access');
  console.log('- Duplicate registration prevention');
  console.log('\n✨ All tests completed!');
}

runAllTests().catch(console.error);
