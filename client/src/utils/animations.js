import { keyframes } from 'styled-components';

export const cardFlip = keyframes`
  0% {
    transform: rotateY(0deg);
  }
  100% {
    transform: rotateY(180deg);
  }
`;

export const cardSummon = keyframes`
  0% {
    transform: scale(0.1) translateY(100px);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) translateY(-20px);
    opacity: 0.8;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
`;

export const cardAttack = keyframes`
  0% {
    transform: translateX(0) rotate(0);
  }
  50% {
    transform: translateX(100px) rotate(15deg);
  }
  100% {
    transform: translateX(0) rotate(0);
  }
`;

export const cardDestroy = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.5;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
`;

export const chainLink = keyframes`
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`; 