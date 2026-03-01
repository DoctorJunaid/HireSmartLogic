const unexpectedRouteController = (req, res) => {
  res.status(404).json({
    isStatus: false,
    msg: "Route not found",
    data: null,
  });
};


export {
  unexpectedRouteController,
};