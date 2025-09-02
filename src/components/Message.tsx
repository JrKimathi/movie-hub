import React, { useEffect } from "react";
import styles from "../styles/messagestyles/message.module.css";

interface MessageProps {
  text: string;
  type?: "info" | "error" | "success";
  onClose: () => void;
  duration?: number;
}

const Message: React.FC<MessageProps> = ({ text, type = "info", onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`${styles.message} ${styles[type]}`}>
      {text}
    </div>
  );
};

export default Message;
