import React from "react";
import ReactDOM from "react-dom";
import { Form, Text, Checkbox } from "react-form";

const EventItem = ({ children, doNothing }) => {
  return <li onClick={doNothing}>{children}</li>;
};

export const EventList = ({ events, doNothing }) => {
  return (
    <ul>
      {events.map((event, index) => {
        return (
          <EventItem doNothing={doNothing} key={index}>
            {event.name}
          </EventItem>
        );
      })}
    </ul>
  );
};

export const Forms = ({ status, killed, account, dispatch }) => {
  if (killed) return <KillForm />;
  return (
    <div>
      {status ? <span /> : <CreateForm dispatch={dispatch} account={account} />}
      {status == "payable" ? (
        <PayForm dispatch={dispatch} account={account} />
      ) : (
        <span />
      )}
      {status == "reclaimable" ? (
        <ReclaimForm dispatch={dispatch} account={account} />
      ) : (
        <span />
      )}
      <KillForm account={account} dispatch={dispatch} />
    </div>
  );
};

const CreateForm = ({ account, dispatch }) => (
  <Form
    onSubmit={submittedValues => {
      dispatch({ type: "create", payer: account, ...submittedValues });
    }}
  >
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
  </Form>
);
const PayForm = ({ account, dispatch }) => (
  <Form
    onSubmit={submittedValues => {
      dispatch({ type: "pay", payee: account, ...submittedValues });
    }}
  >
    {formApi => (
      <form onSubmit={formApi.submitForm} id="pform">
        <label htmlFor="password">Password</label>
        <Text field="password" id="password" />
        <button type="submit">Withdraw</button>
      </form>
    )}
  </Form>
);
const ReclaimForm = ({ account, dispatch }) => (
  <Form
    onSubmit={submittedValues => {
      dispatch({ type: "reclaim", payer: account, ...submittedValues });
    }}
  >
    {formApi => (
      <form onSubmit={formApi.submitForm} id="rform">
        <label htmlFor="payee">Payee</label>
        <Text field="payee" id="payee" />
        <label htmlFor="password">Password</label>
        <Text field="password" id="password" />
        <button type="submit">Reclaim</button>
      </form>
    )}
  </Form>
);

const KillForm = ({ account, dispatch }) => (
  <Form
    onSubmit={submittedValues => {
      dispatch({ type: "kill", account: account, ...submittedValues });
    }}
  >
    {formApi => (
      <form onSubmit={formApi.submitForm} id="form2">
        <label htmlFor="kill">Kill?</label>
        <Checkbox field="killed" id="killed" />
        <button type="submit">Submit</button>
      </form>
    )}
  </Form>
);
