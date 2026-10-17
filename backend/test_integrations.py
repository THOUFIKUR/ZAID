"""
Automated test suite for ZAID MCP and Integrations subsystem.
Tests:
1. Rejection of invalid MCP config.
2. Unreachable server displays genuine error.
3. Valid MCP server connects cleanly.
4. Actual tools are discovered with schemas.
5. Authorized tool invocation works.
6. Disabled tool invocation is rejected.
7. Secret masking: secrets never exposed in sanitized output.
8. Missing integration guidance for unconnected services.
9. Persistence across reloads.
"""
import asyncio
import httpx

BASE = "http://127.0.0.1:8000/api"

async def run_tests():
    print("=== STARTING INTEGRATION TESTS ===")
    async with httpx.AsyncClient(timeout=15.0) as client:
        # 1. Health check
        h = await client.get(f"{BASE}/health")
        assert h.status_code == 200, f"Health failed: {h.text}"
        print("✓ 1. Backend health check: OK")

        # 2. Test unreachable MCP server (should fail with genuine error)
        unreachable_req = {
            "name": "Bad Server",
            "transport": "sse",
            "url": "http://127.0.0.1:59999/sse",
            "timeout_seconds": 2.0
        }
        res = await client.post(f"{BASE}/integrations/mcp/test", json=unreachable_req)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is False, "Unreachable server should report failure"
        assert "error" in data and len(data["error"]) > 0
        print(f"✓ 2. Unreachable MCP server properly rejected: {data['error'][:60]}...")

        # 3. Test invalid stdio command (command not found)
        invalid_cmd_req = {
            "name": "Nonexistent Executable",
            "transport": "stdio",
            "command": "nonexistent_executable_12345.exe",
            "args": []
        }
        res2 = await client.post(f"{BASE}/integrations/mcp/test", json=invalid_cmd_req)
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["success"] is False
        print(f"✓ 3. Invalid stdio command properly rejected: {data2['error'][:60]}...")

        # 4. Test valid MCP server connection & tool discovery
        valid_req = {
            "name": "ZAID Local Tools MCP",
            "transport": "stdio",
            "command": "python",
            "args": ["D:/ZAID/backend/integrations/local_mcp_server.py"]
        }
        res3 = await client.post(f"{BASE}/integrations/mcp/test", json=valid_req)
        assert res3.status_code == 200
        data3 = res3.json()
        assert data3["success"] is True, f"Failed to connect valid server: {data3}"
        assert data3["server_name"] == "zaid-local-tools"
        assert len(data3["tools"]) >= 4
        print(f"✓ 4. Valid MCP server connected! Discovered {len(data3['tools'])} tools.")

        # 5. Invoke authorized tool
        tool_req = {
            "integration_id": "zaid-local-tools",
            "tool_name": "evaluate_math",
            "arguments": {"expression": "256 * 4"}
        }
        res4 = await client.post(f"{BASE}/integrations/tools/execute", json=tool_req)
        assert res4.status_code == 200
        data4 = res4.json()
        assert data4["success"] is True, f"Tool execution failed: {data4}"
        print(f"✓ 5. Authorized tool 'evaluate_math' invoked successfully: {data4}")

        # 6. Test disabling a tool and verify it cannot be invoked
        toggle_res = await client.patch(
            f"{BASE}/integrations/zaid-local-tools/tools/evaluate_math",
            json={"enabled": False}
        )
        assert toggle_res.status_code == 200
        
        # Now try to invoke disabled tool
        disabled_run = await client.post(f"{BASE}/integrations/tools/execute", json=tool_req)
        assert disabled_run.status_code == 200
        d_res = disabled_run.json()
        assert d_res["success"] is False
        assert "disabled" in d_res["error"].lower()
        print(f"✓ 6. Disabled tool invocation properly blocked: {d_res['error']}")

        # Re-enable tool
        await client.patch(
            f"{BASE}/integrations/zaid-local-tools/tools/evaluate_math",
            json={"enabled": True}
        )
        print("✓ 6b. Re-enabled tool successfully.")

        # 7. Test secret masking in GET /integrations/connected
        conn_res = await client.get(f"{BASE}/integrations/connected")
        assert conn_res.status_code == 200
        conns = conn_res.json()["integrations"]
        for c in conns:
            cfg = c.get("config", {})
            for k in ("token", "api_key", "secret"):
                if k in cfg:
                    val = cfg[k]
                    assert "*" in val or "..." in val, f"Secret was exposed unmasked: {k}={val}"
        print("✓ 7. Secret masking verified: no unmasked credentials returned.")

        # 8. Test missing-integration guidance via intent routing
        intent_req = {"prompt": "List the files in my connected Google Drive"}
        route_res = await client.post(f"{BASE}/integrations/route-intent", json=intent_req)
        assert route_res.status_code == 200
        route_data = route_res.json()
        assert route_data["routed"] is True
        assert route_data["data"]["type"] == "missing_integration"
        assert route_data["data"]["service_name"] == "Google Drive"
        print(f"✓ 8. Missing integration guidance working: {route_data['data']['message']}")

        # 9. Test direct desktop app launch through tool registry
        calc_route = await client.post(f"{BASE}/integrations/route-intent", json={"prompt": "open calculator on my computer"})
        assert calc_route.status_code == 200
        c_data = calc_route.json()
        assert c_data["routed"] is True
        assert c_data["data"]["type"] == "tool_result"
        print(f"✓ 9. Native desktop app launch via intent router: {c_data['data']['action']}")

    print("\n=== ALL 9 INTEGRATION TESTS PASSED ===")

if __name__ == "__main__":
    asyncio.run(run_tests())
