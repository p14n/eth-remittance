import React from "react";
import { createStore, applyMiddleware } from "redux";
import { connect, Provider } from "react-redux";
import logger from "redux-logger";
import ReactDOM from "react-dom";
import { Form, Text } from "react-form";
import Web3 from "web3";
import Promise from "bluebird";
import truffleContract from "truffle-contract";
import remittanceJson from "../../build/contracts/Remittance.json";

import { EventList, Forms } from "./components";

window.addEventListener("load", function() {
  let web3js = null;
  if (typeof web3 !== "undefined") {
    // Use Mist/MetaMask's provider
    web3js = new Web3(web3.currentProvider);
  } else {
    web3js = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  startApp(web3js);
});

const startApp = web3js => {
  Promise.promisifyAll(web3js.eth, { suffix: "Promise" });
  Promise.promisifyAll(web3js.utils, { suffix: "Promise" });
  Promise.promisifyAll(web3js.eth.net, { suffix: "Promise" });

  const Remittance = truffleContract(remittanceJson);
  Remittance.setProvider(web3js.currentProvider);

  if (typeof Remittance.currentProvider.sendAsync !== "function") {
    Remittance.currentProvider.sendAsync = function() {
      return Remittance.currentProvider.send.apply(
        Remittance.currentProvider,
        arguments
      );
    };
  }

  web3js.eth
    .getAccountsPromise()
    .then(accounts => {
      if (accounts.length == 0) {
        throw new Error("No account with which to transact");
      }

      return {
        network: web3js.eth.net,
        account: accounts[0]
      };
    })
    .then(result => {
      return Remittance.deployed().then(deployed => {
        return {
          deployed: deployed,
          ...result
        };
      });
    })
    .then(({ deployed, account }) => {
      console.log(account);
      console.log(deployed);
      console.log(web3js);
      startUI(account, deployed, web3js);
    })
    .catch(console.error);
};

const startUI = (account, contract, web3js) => {
  const failed = err => {
    return { type: "failed", error: err };
  };

  const eqIgnoreCase = (v1, v2) =>
    v1 && v2 && v1.toUpperCase() === v2.toUpperCase();

  const contractService = store => next => action => {
    switch (action.type) {
      case "create":
        let hash = web3js.utils.soliditySha3(action.payee, action.password);
        let value = web3js.utils.toWei(action.amount, "ether");

        contract
          .createInstance(action.payee, hash, {
            from: action.payer,
            value: value
          })
          .catch(e => next(failed(e)));

      case "pay":
        contract
          .withdraw(action.password, { from: action.payee })
          .catch(e => next(failed(e)));

      case "kill":
        contract
          .setKilled(action.killed, { from: action.account })
          .catch(e => next(failed(e)));

      case "reclaim":
        contract
          .reclaim(action.payee, web3js.utils.fromAscii(action.password), {
            from: action.payer
          })
          .catch(e => next(failed(e)));
      default:
        next(action);
    }
  };

  const eventAction = (state = {}, action) => {
    switch (action.type) {
      case "failed":
        console.log(action.error);
        return state;
      case "accountloaded":
        return { account: action.account, ...state };
      case "event":
        if (
          !eqIgnoreCase(action.from, state.account) &&
          !eqIgnoreCase(action.to, state.account)
        )
          return state;
        let ev = state.events.map(e => e);
        ev.push(action);
        switch (action.name) {
          case "created":
            if (state.account == action.from) {
              return { ...state, events: ev, status: "reclaimable" };
            } else {
              return { ...state, events: ev, status: "payable" };
            }
          case "paid":
            return { ...state, events: ev, status: "" };
          case "killed":
            return { ...state, events: ev, killed: action.killed };
          default:
            return { ...state, events: ev, status: action.name };
        }
        return { ...state, events: ev };
      default:
        return state;
    }
  };

  const mapStateToProps = state => ({ ...state });

  const store = createStore(
    eventAction,
    { events: [], account: account },
    applyMiddleware(contractService, logger)
  );

  const mapDispatchToProps = dispatch => {
    return {
      dispatch: dispatch
    };
  };

  const VisibleEventList = connect(mapStateToProps, mapDispatchToProps)(
    EventList
  );

  const VisibleForms = connect(mapStateToProps, mapDispatchToProps)(Forms);

  ReactDOM.render(
    <Provider store={store}>
      <div>
        <VisibleEventList />
        <VisibleForms />
      </div>
    </Provider>,
    document.getElementById("app")
  );

  const eventToAction = name => (err, result) => {
    store.dispatch({ type: "event", name: name, ...result.args });
  };

  contract.PaidEvent().watch(eventToAction("paid"));
  contract.ReclaimedEvent().watch(eventToAction("reclaimed"));
  contract.Instantiated().watch(eventToAction("created"));
  contract.KilledStateChange().watch(eventToAction("killed"));
  store.dispatch({ type: "apploaded" });
};
