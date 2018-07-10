import React from 'react';
import styled, { css } from 'styled-components';
import theme from '../theme';
import SearchIcon from '@material-ui/icons/Search';

const searchWrapper = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  paddingLeft: '11px',
};

const MobileInput = styled.input`
  display: block;
  border-radius: 4px;
  background-color: #eef2f5;
  font-size: 16px;
  border: none;
  height: 7%;
  width: ${({ wide }) => (wide ? '100%' : 'auto')};
  appearance: none;
  box-shadow: none;
  padding-left: ${({ search }) => (search ? '40px' : '15px')};
  &:focus {
  outline: none;
  border-color: ${theme.contentBorderActive};
  }
`;

const MobileSearch = props => (
  <div style={{ position: 'relative' }}>
    {props.search && <div style={searchWrapper}>
      <SearchIcon />
    </div>}
    <MobileInput {...props} />
  </div>
);

export default MobileSearch;
