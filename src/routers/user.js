const express = require('express');
const Users = require('../models/user');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEamil, sendCancelationEamil } = require('../emails/account');
const router = new express.Router();

router.post('/users', async (req, res) => {
  const user = new Users(req.body);
  try {
    await user.save();
    sendWelcomeEamil(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/users/login', async (req, res) => {
  try {
    const user = await Users.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token;
    });

    await req.user.save();

    res.send();
  } catch (error) {
    res.status(500).send();
  }
});
router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(400);
  }
});
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

router.patch('/users/me', auth, async (req, res) => {
  const upddated = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];

  const isvalidOperation = upddated.every(update =>
    allowedUpdates.includes(update)
  );
  if (!isvalidOperation) {
    return res.status(400).send({ error: 'invalid' });
  }

  try {
    const user = req.user;
    /*short hand
      upddated.forEach((update)=>user[update]=req.body[update])
    */

    upddated.forEach(update => {
      user[update] = req.body[update];
    });
    await user.save();
    //const user = await Users.findByIdAndUpdate(_id, req.body, {new: true,runValidators: true});
    res.send(user);
  } catch (error) {
    res.status(500).send();
  }
});

router.delete('/users/me', auth, async (req, res) => {
  const _id = req.user._id;
  try {
    // const user = await Users.findByIdAndDelete(_id);
    // if (!user) return res.status(404).send();
    // res.send(user);
    await req.user.remove();
    sendCancelationEamil(req.user.email, req.user.name);
    res.send(req.user);
  } catch (error) {
    res.status(500).send();
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(new Error('please upload Image'));
    }
    cb(undefined, true);
    //cb(undefined,false);
  }
});

router.post(
  '/users/me/avatar',
  auth,
  upload.single('upload'),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    //req.user.avatar = req.file.buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await Users.findById(req.params.id);

    if (!user || !user.avatar) throw new Error();

    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

module.exports = router;
