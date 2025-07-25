import Student from "../models/Student.js";
import Employer from "../models/Employer.js";
import { comparePassword } from "../utils/bcryptPasswordHash.js";
import { generateNewRefreshToken, generateNewToken } from "../utils/tokens.js";
import RefreshToken from "../models/RefreshToken.js";

export const login = async (req, res) => {
  try {
    let userType = "student";
    const { email, password } = req.body;
    let user = await Student.findOne({
      email,
    });
    if (!user) {
      user = await Employer.findOne({
        email,
      });
      if (!user) {
        return res.status(404).json({ message: "email or password is wrong" });
      }
      userType = "employer";
    }
    const isPasswordMatching = await comparePassword(password, user.password);
    if (!isPasswordMatching) {
      return res.status(401).json({ message: "email or password is wrong" });
    }
    const dataToSendInToken = {
      userId: user._id,
      type: userType,
    };
    const dataToSendInRefreshToken = {
      userId: user._id,
    };
    const accessToken = generateNewToken(dataToSendInToken, "10d");
    const refreshToken = generateNewRefreshToken(
      dataToSendInRefreshToken,
      "10d"
    );
    await new RefreshToken({
      hash: refreshToken,
      userId: user._id,
      creationDate: Date.now(),
      isValid: true,
    }).save();
    res.status(200).json({ user, accessToken, refreshToken });
  } catch (error) {
    console.log("Error while trying to login");
    console.log(error);
    res.send(500).json({ message: "something went wrong" });
  }
};

export const renewAccessToken = async (req, res) => {
  try {
    const { userId } = req.user;
    let user = await Student.findOne({ _id: userId });
    let userType = "student";
    if (!user) {
      user = await Employer.findOne({ _id: userId });
      if (!user) {
        return res.status(401).json({ message: "invalid token" });
      }
      userType = "employer";
    }

    const dataToSendInToken = {
      userId: userId,
      type: userType,
    };

    const accessToken = generateNewToken(dataToSendInToken, "1d");
    res.status(200).json({ user, accessToken });
  } catch (error) {
    console.log("Something went wrong");
    console.log(error);
    res.status(500).json({ message: "Can't renew access token" });
  }
};
