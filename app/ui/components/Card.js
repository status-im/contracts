import styled from 'styled-components'

import { theme } from '../theme';
import { media } from '../utils/media';

const StyledCard = styled.div`
  width: ${({ width }) => width || '282px'};
  height: ${({ height }) => height || '322px'};
  background: ${theme.contentBackground};
  border: ${({ border }) => border || `1px solid ${theme.contentBorder}`};
  border-radius: 3px;
  min-height: 30vh;
  ${media.desktop`margin-top: 5%;`}
  ${media.giant`margin-top: 5%;`}
  ${media.tablet`margin-top: 25%;`}
  ${media.phone`margin-top: 25%;`}
`

export default StyledCard
