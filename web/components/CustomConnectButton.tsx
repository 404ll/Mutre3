import { ConnectButton as DappKitConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import React from "react";

export const CustomConnectButton: React.FC = () => {
  const account = useCurrentAccount();
  
  // 基础样式对象 - 连接前后都适用
  const baseStyle = {
    border: '1px solid rgba(59, 130, 246, 0.3)',
    background: 'transparent',
    color: 'rgb(147, 197, 253)',
    fontSize: '1.125rem',
    height: '2rem',
    padding: '0 1rem',
    borderRadius: '0.375rem',
    fontWeight: '500',
    transition: 'all 300ms'
  };
  
  // 自定义样式覆盖组件
  return (
    <div className="custom-connect-wrapper">
      <style jsx global>{`
        /* 未连接状态样式 */
        .custom-connect-wrapper button {
          border: 1px solid rgba(59, 130, 246, 0.3) !important;
          background: transparent !important;
          color: rgb(147, 197, 253) !important;
          font-size: 1.125rem !important;
          height: 2rem !important;
          padding: 0 1rem !important;
          border-radius: 0.375rem !important;
          font-weight: 500 !important;
          transition: all 300ms !important;
        }
        
        /* 已连接状态样式 */
        .custom-connect-wrapper [role="button"] {
          border: 1px solid rgba(59, 130, 246, 0.3) !important;
          background: transparent !important;
          color: rgb(147, 197, 253) !important;
          font-size: 1.125rem !important;
          height: 2rem !important;
          padding: 0 1rem !important;
          border-radius: 0.375rem !important;
          font-weight: 500 !important;
        }
        
        /* 悬停效果 */
        .custom-connect-wrapper button:hover,
        .custom-connect-wrapper [role="button"]:hover {
          background-color: rgba(30, 64, 175, 0.5) !important;
          color: rgb(147, 197, 253) !important;
        }
      `}</style>
      
      <DappKitConnectButton style={baseStyle} />
    </div>
  );
};