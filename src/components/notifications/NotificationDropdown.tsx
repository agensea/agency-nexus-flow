
import React from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CheckCheck, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotificationDropdownProps {
  children: React.ReactNode;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ children }) => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications 
  } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead} 
              className="h-8"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              <span className="text-xs">Mark all read</span>
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="py-4 px-2 text-center text-muted-foreground">
            No notifications
          </div>
        ) : (
          <>
            <ScrollArea className="h-[300px]">
              <DropdownMenuGroup>
                {notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="p-0">
                    <Link
                      to={notification.link || "#"}
                      className={`flex flex-col w-full p-3 ${
                        !notification.read ? "bg-muted/50" : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{notification.title}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 -mr-1 opacity-50 hover:opacity-100"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <span className="text-xs text-muted-foreground mt-2">
                        {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </ScrollArea>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="justify-center text-sm text-muted-foreground"
              onClick={clearAllNotifications}
            >
              Clear all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
