import React from 'react';
import ReactDOM from 'react-dom';
import {createStore,applyMiddleware} from 'redux';
import {connect,Provider} from 'react-redux'
import logger from 'redux-logger'

import { Form, Text } from 'react-form';

const Web3 = require("web3");
const Promise = require("bluebird");
const truffleContract = require("truffle-contract");

const remittanceJson = require("../../build/contracts/Remittance.json");

if (typeof web3 == 'undefined') {
    window.web3 = new Web3(web3.currentProvider);
} else {
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
}

Promise.promisifyAll(web3.eth, { suffix: "Promise" });
Promise.promisifyAll(web3.utils, { suffix: "Promise" });
Promise.promisifyAll(web3.eth.net, { suffix: "Promise" });

const Remittance = truffleContract(remittanceJson);
Remittance.setProvider(web3.currentProvider);

if (typeof Remittance.currentProvider.sendAsync !== "function") {
    Remittance.currentProvider.sendAsync = function() {
        return Remittance.currentProvider.send.apply(
            Remittance.currentProvider, arguments
        );
    };
}
const asyncDispatchMiddleware = store => next => action => {
    let syncActivityFinished = false;
    let actionQueue = [];

    function flushQueue() {
        actionQueue.forEach(a => store.dispatch(a)); // flush queue
        actionQueue = [];
    }

    function asyncDispatch(asyncAction) {
        actionQueue = actionQueue.concat([asyncAction]);

        if (syncActivityFinished) {
            flushQueue();
        }
    }

    const actionWithAsyncDispatch =
              Object.assign({}, action, { asyncDispatch });

    next(actionWithAsyncDispatch);
    syncActivityFinished = true;
    flushQueue();

};

const failed = action => err => action.asyncDispatch({type:'failed',error:err});

/*
 event PaidEvent(uint amount,address indexed from,address indexed to);
 event ReclaimedEvent(uint amount,address indexed from,address indexed to);
 event Instantiated(bytes32 hash,address indexed from,address indexed to);
 event KilledStateChange(bool killed);

         -> creatable
 created -> reclaimable
         -> payable
 killed -> killed
 paid -> 
 reclaimed -> 
 */

const eqIgnoreCase = (v1,v2) => v1.toUpperCase() === v2.toUpperCase()

function eventAction(state = {}, action) {
    switch (action.type) {
    case 'failed':
        console.log(action.error);
        return state;
    case 'accountloaded':
        return {account:action.account,...state}
    case 'contractloaded':
        return {contract:action.contract,...state}
    case 'create':
        let hash = web3.utils.soliditySha3(action.payee,action.password)
        state.contract.createInstance(action.payee,hash,{from:state.account,value:action.amount})
                .catch(failed(action));
        return {status:'creating',...state};
    case 'pay':
        state.contract.withdraw(action.payee,web3.utils.fromAscii(action.password),{from:state.account})
            .catch(failed(action));
        return {status:'paying',...state};
    case 'reclaim':
        state.contract.reclaim(action.payee,web3.utils.fromAscii(action.password),{from:state.account})
            .catch(failed(action));
        return {status:'reclaming',...state};
    case 'create':
        state.contract.createInstance(action.payee,web3.utils.fromAscii(action.password),{from:state.account,value:1})
            .catch(failed);
        return {status:'creating',...state};
    case 'event':
        if(!eqIgnoreCase(action.from,state.account) && !eqIgnoreCase(action.to,state.account))return state;
        let ev = state.events.map( e => e);
        ev.push(action);
        switch(action.name) {
        case 'created':
            if(state.account == action.from){
                return {...state,events:ev,status:'reclaimable'};
            } else {
                return {...state,events:ev,status:'payable'};
            }
        case 'killed':
            return {...state,events:ev,killed:action.killed};
        default:
            return {...state,events:ev,status:action.name};
        }
        return {...state,events:ev};
    default:
        return state;
  }
}

const mapStateToProps = state => ({...state});

const store = createStore(eventAction,
                          {events:[]},
                          applyMiddleware(asyncDispatchMiddleware,logger))

const mapDispatchToProps = dispatch => {
    return {
        doNothing : () => store.dispatch({type : ''})
    };
};

const EventItem = ({children,doNothing}) => {
    return (<li onClick={doNothing} >{children}</li>)
}

const EventList = ({ events,doNothing }) => {
    return <ul>
        {events.map((event, index) => {
            return <EventItem doNothing={doNothing} key={index}>{event.name}</EventItem>
        })}
    </ul>;
};
const Forms = ({ status,killed }) => {
    if(killed) return <KillForm/>;
    console.log("forms! "+status);
    return <div>
        { status ? <span/>:<CreateForm/> }
    { status == 'payable' ? <PayForm/>:<span/> }
    { status == 'reclaimable' ? <ReclaimForm/>:<span/> }
        <KillForm/>
    </div>;
};

const VisibleEventList = connect(
    mapStateToProps,
    mapDispatchToProps
)(EventList)

const VisibleForms = connect(
    mapStateToProps,
    mapDispatchToProps
)(Forms)

const CreateForm = () => (<Form onSubmit={submittedValues => {

    store.dispatch({type:'create',...submittedValues});
}}>
          {formApi => (
                  <form onSubmit={formApi.submitForm} id="cform">
                  <label htmlFor="payee">Address</label>
                  <Text field="payee" id="payee" />
                  <label htmlFor="password">Password</label>
                  <Text field="password" id="password" />
                  <label htmlFor="amount">Amount</label>
                  <Text field="amount" id="amount" />
                  <button type="submit">Submit</button>
                  </form>
          )}
                          </Form>)
const PayForm = () => (<Form onSubmit={submittedValues => {
    store.dispatch({type:'pay',...submittedValues});
}}>
          {formApi => (
                  <form onSubmit={formApi.submitForm} id="pform">
                  <label htmlFor="password">Password</label>
                  <Text field="password" id="password" />
                  <button type="submit">Withdraw</button>
                  </form>
          )}
                          </Form>)
const ReclaimForm = () => (<Form onSubmit={submittedValues => {
    store.dispatch({type:'reclaim',...submittedValues});
}}>
          {formApi => (
                  <form onSubmit={formApi.submitForm} id="rform">
                  <label htmlFor="payee">Payee</label>
                  <Text field="payee" id="payee" />
                  <label htmlFor="password">Password</label>
                  <Text field="password" id="password" />
                  <button type="submit">Reclaim</button>
                  </form>
          )}
                          </Form>)

const KillForm = () => (<Form onSubmit={submittedValues => {
    store.dispatch({type:'kill',...submittedValues});
}}>
          {formApi => (
                  <form onSubmit={formApi.submitForm} id="form2">
                  <label htmlFor="kill">Kill?</label>
                  <Text field="kill" id="kill" />
                  <button type="submit">Submit</button>
                  </form>
          )}
                          </Form>)

ReactDOM.render(
        <Provider store={store}>
        <div>
        <VisibleEventList/>
        <VisibleForms/>
        </div>
        </Provider>,
    document.getElementById('app')
);

const eventToAction = (name) => (err,result) => {

    store.dispatch({type:'event',name: name, ...result.args});
}


web3.eth.getAccountsPromise()
    .then(accounts => {
        if (accounts.length == 0) {
            throw new Error("No account with which to transact");
        }
        store.dispatch({type:'accountloaded',account:accounts[0]})
        return web3.eth.net;
    })
    .then(network => {

        return Remittance.deployed();
    })
    .then(deployed => {
        deployed.PaidEvent().watch(eventToAction("paid"));
        deployed.ReclaimedEvent().watch(eventToAction("reclaimed"));
        deployed.Instantiated().watch(eventToAction("created"));
        deployed.KilledStateChange().watch(eventToAction("killed"));
        store.dispatch({type:'contractloaded',contract:deployed,})
    })
    .catch(console.error);

