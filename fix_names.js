require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const User = require('./backend/models/User');

async function fixUsernames() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ authProvider: 'google' });

        for (let user of users) {
            // Check if username has the '_timestamp' pattern
            if (user.username.match(/_[a-z0-9]+$/)) {
                // Let's use the local part of the email as a fallback if they don't have a normal name, 
                // but we don't have their displayName here.
                // We'll just convert "aditya_chouksey_xxxxxx" to "Aditya Chouksey"
                let nameParts = user.username.split('_');
                nameParts.pop(); // remove hash
                let niceName = nameParts.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                let counter = 1;
                let newUsername = niceName;
                while (await User.findOne({ username: newUsername, _id: { $ne: user._id } })) {
                    newUsername = `${niceName} ${counter}`;
                    counter++;
                }

                user.username = newUsername;
                await user.save();
                console.log(`Updated user ${user.email} to username: ${newUsername}`);
            }
        }
        console.log('Done fixing user names');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
fixUsernames();
