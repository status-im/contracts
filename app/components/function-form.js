class FunctionForm extends  React.Component {
    constructor(props) {
        super(props);
        this.state = { };
    }

    render(){
        return <div className="function" id="${this.name}-${i}">
            <h4></h4>
            <div className="scenario">
                <div className="code">
                  await  <button>&#9166;</button>
                 <img src="images/loading.gif" className="loading" alt="" />
                </div>
                <p className="error"></p>
                <p className="note"></p>
            </div>
        </div>;
    }
}