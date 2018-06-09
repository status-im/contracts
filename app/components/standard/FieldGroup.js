import React from 'react';
import styled from 'styled-components';
import { FormGroup, FormControl, HelpBlock, InputGroup } from 'react-bootstrap';
import { Field } from '../../ui/components';
import theme from '../../ui/theme';
import { font } from '../../ui/utils/styles/font';

const StyledFormControl = styled(FormControl)`
  ${font({ size: 'small', weight: 'normal' })};
  width: ${({ wide }) => (wide ? '100%' : 'auto')};

  padding: 5px 10px;
  background: ${theme.contentBackground};
  border: 1px solid ${theme.contentBorder};
  border-radius: 3px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
  color: ${theme.textPrimary};
  appearance: none;
  &:focus {
    outline: none;
    border-color: ${theme.contentBorderActive};
  }
  &:read-only {
    color: transparent;
    text-shadow: 0 0 0 ${theme.textSecondary};
  }
`;

const FieldGroup = ({ id, label, button, error, ...props }) => (
  <FormGroup controlId={id} validationState={error ? 'error' : null}>
    <Field label={label} validationState={error ? 'error' : null} wide>
      {button ?
        <InputGroup>
          <InputGroup.Button>
            {button}
          </InputGroup.Button>
          <StyledFormControl {...props} />
        </InputGroup>
       : <StyledFormControl {...props} />
      }
      {error && <HelpBlock>{error}</HelpBlock>}
    </Field>
  </FormGroup>
);

export default FieldGroup;
