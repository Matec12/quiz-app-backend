const OperationalError = require("../utils/operationalError");

// exports.restrict = (...role)=>{

exports.restrict = (...role) => {
  return (req, res, next) => {
    if (role.includes(req.user.role)) {
      return next(
        new OperationalError(
          "you are being restricted to perform this action",
          403
        )
      );
    }

    next();
  };
};

exports.authorize = (...role) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role)) {
      return next(
        new OperationalError("you are not allowed to perform this action", 403)
      );
    }

    next();
  };
};

exports.allowOnlyFromAllowedIPs = (req, res, next) => {
  const allowedIPs = [
    "192.168.1.100",
    "192.168.1.101",
    "192.168.1.102",
    "::ffff:127.0.0.1",
    "102.89.23.31/32",
    "::1",
  ];
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  if (allowedIPs.includes(ip)) {
    next();
  } else {
    res.status(403).send("Access Denied: IP Address Not Allowed");
  }
};
