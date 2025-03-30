import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Department } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import { useAuth } from "@/hooks/use-auth";


type UserManagementProps = {
  user: User;
  onLogout: () => Promise<void>;
};

export default function UserManagement({ user, onLogout }: UserManagementProps) {
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const { user: currentUser } = useAuth();

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const filteredUsers = users?.filter(u =>
    selectedDepartment === "all" || u.departmentId === parseInt(selectedDepartment)
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <MobileSidebar user={user} />

      <div className="flex-1 overflow-auto md:pt-0 pt-16">
        <Header
          title="User Management"
          subtitle="Manage user accounts, roles and departments"
          showAddButton={user.role === 'admin'}
          addButtonLabel="Add User"
          onAddClick={() => setCreateUserOpen(true)}
          user={user}
          onLogout={onLogout}
        />

        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-white p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Administrators</p>
                  <h3 className="text-2xl font-bold">
                    {users?.filter(u => u.role === "admin").length || 0}
                  </h3>
                </div>
                <div className="bg-[#F44336] bg-opacity-10 p-2 rounded-full">
                  <span className="material-icons text-[#F44336]">admin_panel_settings</span>
                </div>
              </div>
            </Card>

            <Card className="bg-white p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Department Heads</p>
                  <h3 className="text-2xl font-bold">
                    {users?.filter(u => u.role === "department_head").length || 0}
                  </h3>
                </div>
                <div className="bg-[#1565C0] bg-opacity-10 p-2 rounded-full">
                  <span className="material-icons text-[#1565C0]">supervisor_account</span>
                </div>
              </div>
            </Card>

            <Card className="bg-white p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Associates</p>
                  <h3 className="text-2xl font-bold">
                    {users?.filter(u => u.role === "associate").length || 0}
                  </h3>
                </div>
                <div className="bg-[#26A69A] bg-opacity-10 p-2 rounded-full">
                  <span className="material-icons text-[#26A69A]">person</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Department Filter */}
          <div className="mb-4">
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
              className="w-48"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments?.map(dept => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map(u => {
                    const dept = departments?.find(d => d.id === u.departmentId);
                    return (
                      <TableRow key={u.id}>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>{u.username}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{dept?.name || '-'}</TableCell>
                        <TableCell>
                          {user.role === 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { /* Handle edit */ }}
                            >
                              Edit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!filteredUsers || filteredUsers.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}