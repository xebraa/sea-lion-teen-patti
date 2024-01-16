import React from "react";
import "./timer.scss";

const Timer = ({ time, topClass }) => {
  return Boolean(time > 0) ? <div className={`timer-container ${topClass}`}>{time}</div> : null;
};

export default Timer;
