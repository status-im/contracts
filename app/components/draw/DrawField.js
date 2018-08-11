import React from 'react';
import { CirclePicker } from 'react-color';
import 'flexboxgrid';
import './draw.css';
import {
  AppBar,
  Card,
  CardHeader,
  CardContent,
  GridList,
  GridTile,
  IconButton,
  MenuItem,
  Button,
  Select,
  TextField,
  Toolbar,
} from '@material-ui/core';
import Slider from '@material-ui/lab/Slider';
import UndoIcon from '@material-ui/icons/Undo';
import RedoIcon from '@material-ui/icons/Redo';
import ClearIcon from '@material-ui/icons/Delete';
import SaveIcon from '@material-ui/icons/Save';
import RemoveIcon from '@material-ui/icons/Clear';
import DownloadIcon from '@material-ui/icons/CloudDownload';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import ZoomOutIcon from '@material-ui/icons/ZoomOut';
//TODO remove data assets
import dataJson from './data.json';
import dataJsonControlled from './data.json.controlled';
import dataUrl from './data.url';

import { SketchField, Tools } from 'react-sketch';
import DropZone from 'react-dropzone';

const styles = {
  root: {
    padding: '3px',
    display: 'flex',
    flexWrap: 'wrap',
    margin: '10px 10px 5px 10px',
    justifyContent: 'space-around'
  },
  gridList: {
    width: '100%',
    overflowY: 'auto',
    marginBottom: '24px'
  },
  gridTile: {
    backgroundColor: '#fcfcfc'
  },
  appBar: {
    backgroundColor: '#333'
  },
  radioButton: {
    marginTop: '3px',
    marginBottom: '3px'
  },
  separator: {
    height: '42px',
    backgroundColor: 'white'
  },
  iconButton: {
    fill: 'white',
    width: '42px',
    height: '42px'
  },
  dropArea: {
    width: '100%',
    height: '64px',
    border: '2px dashed rgb(102, 102, 102)',
    borderStyle: 'dashed',
    borderRadius: '5px',
    textAlign: 'center',
    paddingTop: '20px'
  },
  activeStyle: {
    borderStyle: 'solid',
    backgroundColor: '#eee'
  },
  rejectStyle: {
    borderStyle: 'solid',
    backgroundColor: '#ffdddd'
  }
};

/**
 * Helper function to manually fire an event
 *
 * @param el the element
 * @param etype the event type
 */
function eventFire(el, etype) {
  if (el.fireEvent) {
    el.fireEvent('on' + etype);
  } else {
    var evObj = document.createEvent('Events');
    evObj.initEvent(etype, true, false);
    el.dispatchEvent(evObj);
  }
}

class SketchFieldDemo extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      lineColor: 'black',
      lineWidth: 1,
      fillColor: '#68CCCA',
      backgroundColor: 'transparent',
      controlledValue: props.canvasState,
      shadowWidth: 0,
      shadowOffset: 0,
      tool: Tools.Pencil,
      fillWithColor: false,
      fillWithBackgroundColor: false,
      drawings: [],
      canUndo: false,
      canRedo: false,
      controlledSize: false,
      sketchWidth: 600,
      sketchHeight: 600,
      stretched: true,
      stretchedX: false,
      stretchedY: false,
      originX: 'left',
      originY: 'top'
    };
  }

  componentDidUpdate(prevProps) {
    const { canvasState } = this.props;
    if (canvasState && canvasState !== prevProps.canvasState) {
      this.setState({ controlledValue: canvasState });
    }
  }

  _selectTool = event => {
    this.setState({
      tool: event.target.value
    });
  };
  _save = () => {
    let drawings = this.state.drawings;
    drawings.push(this._sketch.toDataURL());
    this.setState({drawings: drawings});
  };

  _saveToChain = () => {
    const { setTileMapState } = this.props;
    const current = JSON.stringify(this._sketch.toJSON());
    setTileMapState(current);
  }

  _download = () => {
    /*eslint-disable no-console*/

    console.save(this._sketch.toDataURL(), 'toDataURL.txt');
    console.save(JSON.stringify(this._sketch.toJSON()), 'toDataJSON.txt');

    /*eslint-enable no-console*/

    let {imgDown} = this.refs;
    let event = new Event('click', {});

    imgDown.href = this._sketch.toDataURL();
    imgDown.download = 'toPNG.png';
    imgDown.dispatchEvent(event);
  };
  _renderTile = (drawing, index) => {
    return (
      <GridTile
        key={index}
        title='Canvas Image'
        actionPosition="left"
        titlePosition="top"
        titleBackground="linear-gradient(to bottom, rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.3) 70%,rgba(0,0,0,0) 100%)"
        cols={1} rows={1} style={styles.gridTile}
        actionIcon={<IconButton onClick={(c) => this._removeMe(index)}><RemoveIcon
                                                                         color="white"/></IconButton>}>
        <img src={drawing}/>
      </GridTile>
    );
  };
  _removeMe = (index) => {
    let drawings = this.state.drawings;
    drawings.splice(index, 1);
    this.setState({drawings: drawings});
  };
  _undo = () => {
    this._sketch.undo();
    this.setState({
      canUndo: this._sketch.canUndo(),
      canRedo: this._sketch.canRedo()
    })
  };
  _redo = () => {
    this._sketch.redo();
    this.setState({
      canUndo: this._sketch.canUndo(),
      canRedo: this._sketch.canRedo()
    })
  };
  _clear = () => {
    this._sketch.clear();
    this._sketch.setBackgroundFromDataUrl('');
    this.setState({
      controlledValue: null,
      backgroundColor: 'transparent',
      fillWithBackgroundColor: false,
      canUndo: this._sketch.canUndo(),
      canRedo: this._sketch.canRedo()
    })
  };
  _onSketchChange = () => {
    let prev = this.state.canUndo;
    let now = this._sketch.canUndo();
    if (prev !== now) {
      this.setState({canUndo: now});
    }
  };
  _onBackgroundImageDrop = (accepted/*, rejected*/) => {
    if (accepted && accepted.length > 0) {
      let sketch = this._sketch;
      let reader = new FileReader();
      let {stretched, stretchedX, stretchedY, originX, originY} = this.state;
      reader.addEventListener('load', () => sketch.setBackgroundFromDataUrl(reader.result, {
        stretched: stretched,
        stretchedX: stretchedX,
        stretchedY: stretchedY,
        originX: originX,
        originY: originY
      }), false);
      reader.readAsDataURL(accepted[0]);
    }
  };
  componentDidMount = () => {

    /*eslint-disable no-console*/

    (function (console) {
      console.save = function (data, filename) {
        if (!data) {
          console.error('Console.save: No data');
          return;
        }
        if (!filename) filename = 'console.json';
        if (typeof data === 'object') {
          data = JSON.stringify(data, undefined, 4)
        }
        var blob = new Blob([data], {type: 'text/json'}),
            e = document.createEvent('MouseEvents'),
            a = document.createElement('a');
        a.download = filename;
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e)
      }
    })(console);

    /*eslint-enable no-console*/

  };
  render = () => {
    const { controlledValue } = this.state;
    const { canvasState } = this.props;
    console.log(this._sketch && this._sketch.toJSON())
    return (
      <div className='container' style={{ width: '100vw' }}>
        <AppBar position="static" color="default">
          <Toolbar style={{ display: 'flex', justifyContent: 'space-evenly' }}>
            <IconButton
              ref='zoom'
              onClick={(e) => this._sketch.zoom(1.25)}>
              <ZoomInIcon/>
            </IconButton>
            <IconButton
              ref='zoom1'
              onClick={(e) => this._sketch.zoom(0.8)}>
              <ZoomOutIcon/>
            </IconButton>
            <Select value={this.state.tool} onChange={this._selectTool}>
              <MenuItem value={Tools.Select}>Select</MenuItem>
              <MenuItem value={Tools.Pencil}>Pencil</MenuItem>
              <MenuItem value={Tools.Line}>Line</MenuItem>
              <MenuItem value={Tools.Rectangle}>Rectangle</MenuItem>
              <MenuItem value={Tools.Circle}>Circle</MenuItem>
              <MenuItem value={Tools.Pan}>Pan</MenuItem>
            </Select>
            <Button variant="outlined" color="primary" onClick={this._saveToChain}>Submit</Button>
          </Toolbar>
        </AppBar>
        <div className='row'>
          <div className='col-xs-12 col-sm-12 col-md-12 col-lg-12'>

            {/* Sketch area */}

            <SketchField
              name='sketch'
              className='canvas-area'
              ref={(c) => this._sketch = c}
              lineColor={this.state.lineColor}
              lineWidth={this.state.lineWidth}
              fillColor={this.state.fillWithColor ? this.state.fillColor : 'transparent'}
              backgroundColor={this.state.fillWithBackgroundColor ? this.state.backgroundColor : 'transparent'}
              width={this.state.controlledSize ? this.state.sketchWidth : null}
              height={this.state.controlledSize ? this.state.sketchHeight : null}
              value={controlledValue}
              forceValue={true}
              onChange={this._onSketchChange}
              tool={this.state.tool}
            />
          </div>
          <div className='row'>
            <div style={{ display: 'flex', alignItems: 'center' }} className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
              <Card style={{margin: '5px 10px 5px 0'}}>
                <CardHeader title='Colors'/>
                <CardContent>
                  <CirclePicker
                    id='lineColor' color={this.state.lineColor}
                    onChange={(color) => this.setState({lineColor: color.hex})}/>
                </CardContent>
                <Button onClick={this.props.request}>Get Content</Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  };
}

export default SketchFieldDemo;
