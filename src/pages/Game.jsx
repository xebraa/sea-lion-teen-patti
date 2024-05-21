import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import Border from "../components/Border";
import Timer from "../components/timer/Timer";
import { io } from "socket.io-client";

const socket = io("https://games.sealion.live/teen-patti", {
  auth: {
    UID: new URLSearchParams(window.location.search).get("uid"),
  },
});

const Game = () => {
  const [isLoading, setLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState(0);
  const [time, setTime] = useState(0);
  const [coin, setCoin] = useState(0);
  const [results, setResults] = useState([]);

  // Pod Amount
  const [bac, setBAC] = useState(0);
  const [bbc, setBBC] = useState(0);
  const [bcc, setBCC] = useState(0);

  const [ypa, setYPA] = useState(0);
  const [ypb, setYPB] = useState(0);
  const [ypc, setYPC] = useState(0);

  const [alert, setAlert] = useState("Connecting with server...");
  const [showingCards, setShowingCards] = useState(false);

  const [showa, setShowA] = useState(false);
  const [showb, setShowB] = useState(false);
  const [showc, setShowC] = useState(false);
  const [winChair, setWinChair] = useState(null);
  const [cards, setCards] = useState(null);

  const [ka, setKA] = useState(true);
  const [kb, setKB] = useState(true);
  const [kc, setKC] = useState(true);

  const numberFormatter = (num) => {
    return Math.abs(num) > 999 ? Math.sign(num) * (Math.abs(num) / 1000).toFixed(1) + "k" : Math.sign(num) * Math.abs(num);
  };

  useEffect(() => {
    if (alert && !isLoading) {
      setTimeout(() => setAlert(false), 4000);
    }
  }, [alert, isLoading]);

  // Fake Bid
  // useEffect(() => {
  //   if (time > 5) {
  //     if (Math.random() <= 0.3) return;

  //     let coins = [100, 1000, 10000, 100000];

  //     const randomBoard = Math.round(Math.random() * 3);

  //     if (randomBoard === 0) {
  //       setBAC((prev) => prev + coins[Math.floor(Math.random() * coins.length)]);
  //     } else if (randomBoard === 1) {
  //       setBBC((prev) => prev + coins[Math.floor(Math.random() * coins.length)]);
  //     } else {
  //       setBCC((prev) => prev + coins[Math.floor(Math.random() * coins.length)]);
  //     }
  //   }
  // }, [time]);

  useEffect(() => {
    socket.on("connect", () => {
      setLoading(false);

      console.log("Server Collected.");
    });

    socket.on("reconnect", () => {
      setLoading(false);
      setAlert("Reconnect successful.");
    });

    socket.on("connect_error", (err) => {
      setLoading(true);
      setTime(0);
      if (err?.data?.authError) {
        setAlert(err.message);
      } else {
        setAlert("Connection lost. retrying...");
      }
    });

    socket.on("TIK", (time) => {
      if (time === 0) {
        setAlert("Showing Card");
        setShowingCards(true);
      }

      setTime(time - 3);
    });

    socket.on("ON_GET_RESULT", (cards, win) => {
      window?.ReactNativeWebView?.postMessage(JSON.stringify({ winPot: win }));

      setCards(cards);

      setTimeout(() => setShowA(true), 1000);
      setTimeout(() => setShowB(true), 2000);
      setTimeout(() => setShowC(true), 3000);
      setTimeout(() => {
        setWinChair(win);
        setResults((prev) => {
          let a = [{ winPot: win }, ...prev];

          a.pop();

          return a;
        });

        switch (win) {
          case "A":
            setKB(false);
            setKC(false);
            break;
          case "B":
            setKA(false);
            setKC(false);
            break;

          default:
            setKB(false);
            setKA(false);
            break;
        }
      }, 4000);
      setTimeout(() => {
        setYPA((prev) => {
          if (win === "A" && Boolean(prev)) {
            let winRate = prev * 2.9;
            setAlert(`Right on! You Win ${numberFormatter(winRate)} beans.`);
          }

          return prev;
        });

        setYPB((prev) => {
          if (win === "B" && Boolean(prev)) {
            let winRate = prev * 2.9;
            setAlert(`Right on! You Win ${numberFormatter(winRate)} beans.`);
          }

          return prev;
        });

        setYPC((prev) => {
          if (win === "C" && Boolean(prev)) {
            let winRate = prev * 2.9;
            setAlert(`Right on! You Win ${numberFormatter(winRate)} beans.`);
          }

          return prev;
        });
      }, 5000);

      setTimeout(() => {
        setShowingCards(false);
        setShowA(false);
        setShowB(false);
        setShowC(false);
        setWinChair(null);

        setYPA(0);
        setYPB(0);
        setYPC(0);

        setKA(true);
        setKB(true);
        setKC(true);
      }, 10000);
    });

    socket.on("BALANCE_CHANGED", (balance, a, b, c) => {
      setCoin(parseInt(balance));

      if (a) setBAC(a);
      if (b) setBBC(b);
      if (c) setBCC(c);
    });

    socket.on("BOARD_A_COIN_CHANGED", (coin) => setBAC(coin));
    socket.on("BOARD_B_COIN_CHANGED", (coin) => setBBC(coin));
    socket.on("BOARD_C_COIN_CHANGED", (coin) => setBCC(coin));

    socket.on("MY_BOARD_A_COIN_CHANGED", (coin) => {
      setCoin((prev) => prev - coin);
      setYPA((prev) => prev + coin);
    });
    socket.on("MY_BOARD_B_COIN_CHANGED", (coin) => {
      setYPB((prev) => prev + coin);
      setCoin((prev) => prev - coin);
    });
    socket.on("MY_BOARD_C_COIN_CHANGED", (coin) => {
      setYPC((prev) => prev + coin);
      setCoin((prev) => prev - coin);
    });

    socket.on("ON_GET_RESULTS", (data) => {
      setResults(data);
    });
  }, []);

  const handleBoardSelect = (board) => {
    if (selectedCoin === 0) {
      setAlert("Please select a coin first.");
      return;
    }

    if (!Boolean(time > 0)) {
      setAlert("Please wait for new game...");
      return;
    }

    if (coin - selectedCoin < selectedCoin) {
      setSelectedCoin(0);
    }

    // send coin to server
    socket.emit("BET", selectedCoin, board);

    // switch (board) {
    //   case "A":
    //     setYPA(ypa + selectedCoin);
    //     break;
    //   case "B":
    //     setYPB(ypb + selectedCoin);
    //     break;

    //   default:
    //     setYPC(ypc + selectedCoin);
    //     break;
    // }
  };

  const handleBetCoinSelect = (amount) => {
    if (amount <= coin) {
      setSelectedCoin(amount === selectedCoin ? 0 : amount);
    } else {
      setAlert("Insufficient coins.");
    }
  };

  return (
    <>
      <Border />

      <img src="/img/close-icon.svg" className="close-btn" onClick={() => window.ReactNativeWebView.postMessage("CLOSE_GAME")} />

      {Boolean(alert) && <div className="alert">{alert}</div>}

      <Timer time={time} />

      {!isLoading && (
        <>
          {showingCards && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 100,
              }}
            ></div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: 8,
            }}
          >
            <span className="title">Teen Patti</span>
          </div>

          <div className="card-wrapper">
            <div
              className="cards"
              style={{
                zIndex: showa ? (ka ? 1000 : 0) : 0,
              }}
            >
              <img className="card" src={showa ? `/img/cards/${cards[0].cards[0]}.png` : "/img/card-bg.png"} alt="" />
              <img className="card" src={showa ? `/img/cards/${cards[0].cards[1]}.png` : "/img/card-bg.png"} alt="" />
              <img className="card" src={showa ? `/img/cards/${cards[0].cards[2]}.png` : "/img/card-bg.png"} alt="" />

              {showa && <div className="msg">{cards[0].name}</div>}
            </div>

            <div
              className="cards"
              style={{
                zIndex: showb ? (kb ? 1000 : 0) : 0,
              }}
            >
              <img className="card" src={showb ? `/img/cards/${cards[1].cards[0]}.png` : "/img/card-bg.png"} alt="" />
              <img className="card" src={showb ? `/img/cards/${cards[1].cards[1]}.png` : "/img/card-bg.png"} alt="" />
              <img className="card" src={showb ? `/img/cards/${cards[1].cards[2]}.png` : "/img/card-bg.png"} alt="" />

              {showb && <div className="msg">{cards[1].name}</div>}
            </div>
            <div
              className="cards"
              style={{
                zIndex: showc ? (kc ? 1000 : 0) : 0,
              }}
            >
              <img className="card" src={showc ? `/img/cards/${cards[2].cards[0]}.png` : "/img/card-bg.png"} alt="" />
              <img className="card" src={showc ? `/img/cards/${cards[2].cards[1]}.png` : "/img/card-bg.png"} alt="" />
              <img className="card" src={showc ? `/img/cards/${cards[2].cards[2]}.png` : "/img/card-bg.png"} alt="" />

              {showc && <div className="msg">{cards[2].name}</div>}
            </div>
          </div>

          <div className="chair-wrapper">
            <img
              src="/img/chair-a.png"
              alt=""
              style={{
                zIndex: winChair === "A" ? 1000 : 0,
              }}
              onClick={() => handleBoardSelect("A")}
            />
            <img
              src="/img/chair-b.png"
              alt=""
              style={{
                zIndex: winChair === "B" ? 1000 : 0,
              }}
              onClick={() => handleBoardSelect("B")}
            />
            <img
              src="/img/chair-c.png"
              alt=""
              style={{
                zIndex: winChair === "C" ? 1000 : 0,
              }}
              onClick={() => handleBoardSelect("C")}
            />
          </div>

          <div className="cash-wrapper">
            <div
              className="cash"
              style={{
                zIndex: winChair === "A" ? 1000 : 0,
              }}
              onClick={() => handleBoardSelect("A")}
            >
              <div className="name">A</div>

              <div className="amount">
                {/* <div className="pot">Pot: {numberFormatter(bac)}</div> */}
                <div className="you">You: {numberFormatter(ypa)}</div>
              </div>
            </div>

            <div
              className="cash"
              style={{
                zIndex: winChair === "B" ? 1000 : 0,
              }}
              onClick={() => handleBoardSelect("B")}
            >
              <div className="name">B</div>

              <div className="amount">
                {/* <div className="pot">Pot: {numberFormatter(bbc)}</div> */}
                <div className="you">You: {numberFormatter(ypb)}</div>
              </div>
            </div>

            <div
              className="cash"
              style={{
                zIndex: winChair === "C" ? 1000 : 0,
              }}
              onClick={() => handleBoardSelect("C")}
            >
              <div className="name">C</div>

              <div className="amount">
                {/* <div className="pot">Pot: {numberFormatter(bcc)}</div> */}
                <div className="you">You: {numberFormatter(ypc)}</div>
              </div>
            </div>
          </div>

          {/* <div className="results">
            <span>C</span>
            <span>A</span>
            <span>C</span>
            <span>B</span>
            <span>A</span>
            <span>B</span>
            <span>B</span>
            <span>A</span>
            <span>A</span>
          </div> */}

          <div className="r2">
            <div className="r3">Result: </div>

            <div>
              {results.map((i, idx) => (
                <div className={`${idx === 0 ? "new" : ""}`}>
                  <img src={`/img/chair-${i.winPot.toLowerCase()}.png`} />
                </div>
              ))}
            </div>
          </div>

          <div className="action">
            <div className="left">
              <img className="hart" src="/img/hart.png" alt="" />
              <span className="balance">{numberFormatter(coin)}</span>{" "}
              <a href="#" onClick={() => window.ReactNativeWebView.postMessage("OPEN_TOP_UP_SCREEN")}>
                Top Up>
              </a>
            </div>

            <div className="right">
              <div className={`${selectedCoin === 100 ? "coin active" : "coin"} ${coin < 100 && "disable"} `} onClick={() => handleBetCoinSelect(100)}>
                100
              </div>
              <div className={`${selectedCoin === 1000 ? "coin active" : "coin"} ${coin < 1000 && "disable"}`} onClick={() => handleBetCoinSelect(1000)}>
                1000
              </div>
              <div className={`${selectedCoin === 10000 ? "coin active" : "coin"} ${coin < 10000 && "disable"} `} onClick={() => handleBetCoinSelect(10000)}>
                10k
              </div>
              <div className={`${selectedCoin === 100000 ? "coin active" : "coin"} ${coin < 100000 && "disable"}`} onClick={() => handleBetCoinSelect(100000)}>
                100k
              </div>

              <a href="#" className="history" onClick={() => window.ReactNativeWebView.postMessage("OPEN_TEEN_PATTI_HISTORY")}></a>
            </div>
          </div>

          <div className="rules-btn" onClick={() => window.ReactNativeWebView.postMessage("OPEN_TEEN_PATTI_RULES")}>
            Rules
          </div>
        </>
      )}
    </>
  );
};

export default Game;
